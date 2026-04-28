import { Pool } from 'pg';

// Reuse pool across serverless invocations within the same container
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
  max: 5,
});

export default pool;
