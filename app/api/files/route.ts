import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        id,
        filename,
        file_date,
        row_count,
        status,
        upload_date,
        created_at
      FROM uploaded_files
      ORDER BY upload_date DESC
      LIMIT 100
    `);

    return NextResponse.json({
      files: result.rows,
      count: result.rows.length,
    });
  } catch (error: any) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files', details: error.message },
      { status: 500 }
    );
  }
}
