import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import Papa from 'papaparse';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BATCH_SIZE = 500;
const COLUMNS_PER_ROW = 19;

function extractDateFromFilename(filename: string): string | null {
  const match = filename.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

function cleanNumeric(value: any): number | null {
  if (!value || value === '') return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

function cleanInteger(value: any): number | null {
  if (!value || value === '') return null;
  const num = parseInt(parseFloat(value).toString());
  return isNaN(num) ? null : num;
}

function buildBatchInsert(rows: any[], filename: string, fileDate: string | null): { text: string; values: any[] } {
  const values: any[] = [];
  const valuePlaceholders: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const offset = i * COLUMNS_PER_ROW;
    const placeholders = Array.from({ length: COLUMNS_PER_ROW }, (_, j) => `$${offset + j + 1}`);
    valuePlaceholders.push(`(${placeholders.join(', ')})`);

    values.push(
      row['Name'] || null,
      row['Origin City'] || null,
      row['Origin State'] || null,
      row['Origin Postal Code'] || null,
      row['Destination City'] || null,
      row['Destination State'] || null,
      row['Destination Postal Code'] || null,
      cleanNumeric(row['Distance(MI)']),
      row['Equipment'] || null,
      cleanInteger(row['Volume: Committed']),
      cleanInteger(row['Volume: Total']),
      cleanNumeric(row['Fuel']),
      cleanNumeric(row['Target Buy/Mile']),
      cleanNumeric(row['Target Buy/Trip']),
      cleanNumeric(row['Target Sell/Mile']),
      cleanNumeric(row['Target Sell/Trip']),
      row['Status'] || null,
      filename,
      fileDate,
    );
  }

  const text = `INSERT INTO main_historical (
    name, origin_city, origin_state, origin_postal_code,
    destination_city, destination_state, destination_postal_code,
    distance_mi, equipment, volume_committed, volume_total,
    fuel, target_buy_per_mile, target_buy_per_trip,
    target_sell_per_mile, target_sell_per_trip, status,
    source_filename, file_date
  ) VALUES ${valuePlaceholders.join(', ')}`;

  return { text, values };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const filename = file.name;

    // Check if file already exists
    const checkResult = await pool.query(
      'SELECT id FROM uploaded_files WHERE filename = $1',
      [filename]
    );

    if (checkResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'File already uploaded', filename },
        { status: 409 }
      );
    }

    const fileDate = extractDateFromFilename(filename);
    const text = await file.text();

    // Parse CSV
    const parseResult = await new Promise<any>((resolve, reject) => {
      Papa.parse(text, {
        header: true,
        complete: resolve,
        error: reject,
      });
    });

    const rows = parseResult.data.filter((row: any) => {
      return Object.values(row).some(val => val !== '');
    });

    if (rows.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
    }

    // Begin transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert rows in batches for performance
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const query = buildBatchInsert(batch, filename, fileDate);
        await client.query(query.text, query.values);
      }

      // Mark file as uploaded
      await client.query(
        `INSERT INTO uploaded_files (filename, file_date, row_count, status)
         VALUES ($1, $2, $3, 'completed')`,
        [filename, fileDate, rows.length]
      );

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        filename,
        rowCount: rows.length,
        fileDate,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process upload', details: error.message },
      { status: 500 }
    );
  }
}
