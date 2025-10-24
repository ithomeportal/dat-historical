import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Verify the request is from a cron job (in production, add auth header check)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Clear old summaries for regeneration
      await client.query('DELETE FROM route_summaries WHERE period_start >= CURRENT_DATE - INTERVAL \'90 days\'');

      // Generate monthly summaries for last 12 months
      await client.query(`
        INSERT INTO route_summaries (
          origin_city,
          origin_state,
          destination_city,
          destination_state,
          equipment,
          period_start,
          period_end,
          total_quotes,
          avg_distance_mi,
          avg_target_sell_per_mile,
          min_target_sell_per_mile,
          max_target_sell_per_mile,
          avg_target_sell_per_trip
        )
        SELECT
          origin_city,
          origin_state,
          destination_city,
          destination_state,
          equipment,
          DATE_TRUNC('month', file_date)::date as period_start,
          (DATE_TRUNC('month', file_date) + INTERVAL '1 month - 1 day')::date as period_end,
          COUNT(*) as total_quotes,
          AVG(distance_mi) as avg_distance_mi,
          AVG(target_sell_per_mile) as avg_target_sell_per_mile,
          MIN(target_sell_per_mile) as min_target_sell_per_mile,
          MAX(target_sell_per_mile) as max_target_sell_per_mile,
          AVG(target_sell_per_trip) as avg_target_sell_per_trip
        FROM main_historical
        WHERE file_date IS NOT NULL
          AND file_date >= CURRENT_DATE - INTERVAL '12 months'
          AND origin_city IS NOT NULL
          AND destination_city IS NOT NULL
        GROUP BY
          origin_city,
          origin_state,
          destination_city,
          destination_state,
          equipment,
          DATE_TRUNC('month', file_date)
        HAVING COUNT(*) >= 3
        ON CONFLICT (origin_city, origin_state, destination_city, destination_state, equipment, period_start, period_end)
        DO UPDATE SET
          total_quotes = EXCLUDED.total_quotes,
          avg_distance_mi = EXCLUDED.avg_distance_mi,
          avg_target_sell_per_mile = EXCLUDED.avg_target_sell_per_mile,
          min_target_sell_per_mile = EXCLUDED.min_target_sell_per_mile,
          max_target_sell_per_mile = EXCLUDED.max_target_sell_per_mile,
          avg_target_sell_per_trip = EXCLUDED.avg_target_sell_per_trip,
          generated_at = CURRENT_TIMESTAMP
      `);

      const countResult = await client.query('SELECT COUNT(*) as count FROM route_summaries');
      const summaryCount = countResult.rows[0].count;

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: `Generated ${summaryCount} route summaries`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Error generating summaries:', error);
    return NextResponse.json(
      { error: 'Failed to generate summaries', details: error.message },
      { status: 500 }
    );
  }
}
