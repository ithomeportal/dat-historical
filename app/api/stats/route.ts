import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get total counts
    const totalResult = await pool.query(`
      SELECT COUNT(*) as total_rows FROM main_historical
    `);

    const filesResult = await pool.query(`
      SELECT COUNT(*) as total_files FROM uploaded_files
    `);

    const routesResult = await pool.query(`
      SELECT COUNT(DISTINCT (origin_city, origin_state, destination_city, destination_state)) as unique_routes
      FROM main_historical
    `);

    const equipmentResult = await pool.query(`
      SELECT equipment, COUNT(*) as count
      FROM main_historical
      WHERE equipment IS NOT NULL
      GROUP BY equipment
      ORDER BY count DESC
    `);

    const statesResult = await pool.query(`
      SELECT
        origin_state,
        destination_state,
        COUNT(*) as count
      FROM main_historical
      WHERE origin_state IS NOT NULL AND destination_state IS NOT NULL
      GROUP BY origin_state, destination_state
      ORDER BY count DESC
      LIMIT 10
    `);

    const dateRangeResult = await pool.query(`
      SELECT
        MIN(file_date) as earliest_date,
        MAX(file_date) as latest_date
      FROM main_historical
      WHERE file_date IS NOT NULL
    `);

    return NextResponse.json({
      totalRows: parseInt(totalResult.rows[0].total_rows),
      totalFiles: parseInt(filesResult.rows[0].total_files),
      uniqueRoutes: parseInt(routesResult.rows[0].unique_routes),
      equipmentBreakdown: equipmentResult.rows,
      topRoutes: statesResult.rows,
      dateRange: dateRangeResult.rows[0],
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error.message },
      { status: 500 }
    );
  }
}
