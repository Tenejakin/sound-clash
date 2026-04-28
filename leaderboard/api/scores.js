import pg from 'pg';

// ── Database Connection ───────────────────────────────────────────────────
// Vercel provides environment variables directly via process.env.
// In serverless, we usually export a handler.
// Creating the pool outside the handler allows for connection reuse across invocations.
const pool = new pg.Pool({
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // Recommended for serverless: restrict pool size and add a timeout
  max: 1,
  ssl: { rejectUnauthorized: false } // Required for many hosted DBs
});

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  // Disable caching — leaderboard data must be fresh every poll
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // ── Password Check ───────────────────────────────────────────────────────
  const expectedPassword = process.env.API_PASSWORD;
  if (expectedPassword) {
    const providedPassword = req.headers['x-api-password'] || new URL(req.url, 'http://localhost').searchParams.get('pw');
    if (providedPassword !== expectedPassword) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid API password' });
    }
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const result = await pool.query(
      `SELECT id, team, nickname, scream_time_ms, peak_scream_db, final_score, created_at
       FROM scream_sessions
       ORDER BY created_at DESC
       LIMIT 100`
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('[API Error]', err);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
}
