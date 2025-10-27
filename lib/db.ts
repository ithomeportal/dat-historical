import { Pool } from 'pg';

// Configure SSL for production (Aiven requires SSL)
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? {
    rejectUnauthorized: false,
  } : false,
});

export default pool;
