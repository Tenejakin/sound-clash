import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { S3Client, PutObjectCommand, ListBucketsCommand } from '@aws-sdk/client-s3';
import { randomUUID, randomBytes } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
// SerialPort is imported dynamically only when SERIAL_PORT env var is set

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.API_PORT || 4000;
const SCORE_MULTIPLIER = Number(process.env.VITE_SCORE_MULTIPLIER) || 1;

app.use(express.json({ limit: '20mb' }));
app.use(cors());

// ─── PostgreSQL Connection ────────────────────────────────────────────────────
const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

pool.connect()
    .then(async client => {
        console.log('[DB] Connected to PostgreSQL successfully');
        await client.query(`
            ALTER TABLE scream_sessions
                ADD COLUMN IF NOT EXISTS download_token VARCHAR(64) UNIQUE,
                ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ
        `);
        console.log('[DB] Schema up to date');
        client.release();
    })
    .catch(err => {
        console.error('[DB] Connection failed:', err.message);
        process.exit(1);
    });

// ─── Cloudflare R2 Client ─────────────────────────────────────────────────────
const r2Jurisdiction = process.env.R2_JURISDICTION ? `${process.env.R2_JURISDICTION}.` : '';
const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.${r2Jurisdiction}r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
});

// R2 debug: list buckets visible to the configured credentials
app.get('/api/debug/r2', async (_req, res) => {
    try {
        const { Buckets } = await r2.send(new ListBucketsCommand({}));
        res.json({
            endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            configured_bucket: process.env.R2_BUCKET_NAME,
            buckets: Buckets?.map(b => b.Name) ?? [],
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Upload image to R2, return public URL
app.post('/api/upload-image', async (req, res) => {
    const { imageDataUrl } = req.body as { imageDataUrl?: string };

    if (!imageDataUrl || !imageDataUrl.startsWith('data:image/')) {
        res.status(400).json({ error: 'Missing or invalid imageDataUrl' });
        return;
    }

    try {
        const matches = imageDataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
        if (!matches) {
            res.status(400).json({ error: 'Could not parse image data' });
            return;
        }
        const mimeType = matches[1];
        const ext = mimeType.split('/')[1];
        const buffer = Buffer.from(matches[2], 'base64');
        const key = `screams/${randomUUID()}.${ext}`;

        await r2.send(new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
        }));

        const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
        console.log(`[R2] Uploaded → ${publicUrl}`);
        res.status(201).json({ url: publicUrl });
    } catch (err: any) {
        console.error('[R2] Upload error:', err.message);
        res.status(500).json({ error: 'Upload failed', detail: err.message });
    }
});

// Save a scream result into scream_sessions
app.post('/api/scores', async (req, res) => {
    const { team, duration, maxDb, imageUrl, nickname } = req.body as {
        team: string;
        duration: number;
        maxDb: number;
        imageUrl?: string;
        nickname?: string;
    };

    if (!team || duration == null || maxDb == null || isNaN(duration) || isNaN(maxDb)) {
        res.status(400).json({ error: 'Missing or invalid fields: team, duration, maxDb' });
        return;
    }

    const scream_time_ms = Math.max(0, Math.round(duration));
    const peak_scream_db = Math.min(999.99, Math.max(0, Number(maxDb.toFixed(2))));
    const final_score = Math.round(peak_scream_db * (scream_time_ms / 1000) * SCORE_MULTIPLIER);
    const image_url = imageUrl || null;
    const player_nickname = nickname?.trim() || null;
    const download_token = randomBytes(32).toString('hex'); // 64-char unguessable hex token

    try {
        const result = await pool.query(
            `INSERT INTO scream_sessions (team, peak_scream_db, scream_time_ms, final_score, image_url, nickname, download_token, token_expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() + INTERVAL '10 minutes')
       RETURNING id, created_at, download_token, final_score`,
            [team, peak_scream_db, scream_time_ms, final_score, image_url, player_nickname, download_token]
        );

        const row = result.rows[0];
        console.log(`[DB] Saved → id=${row.id}  team=${team}  nick=${player_nickname ?? '—'}  time=${scream_time_ms}ms  db=${peak_scream_db.toFixed(1)}dB  img=${image_url ? 'yes' : 'no'}`);

        // Compute rank: number of sessions with a strictly higher final_score + 1
        const rankResult = await pool.query(
            `SELECT COUNT(*) AS rank FROM scream_sessions WHERE final_score > $1 AND id != $2`,
            [row.final_score, row.id]
        );
        const rank = Number(rankResult.rows[0].rank) + 1;

        res.status(201).json({ success: true, id: row.id, created_at: row.created_at, download_token: row.download_token, rank, final_score: row.final_score });
    } catch (err: any) {
        console.error('[DB] Insert error:', err.message);
        res.status(500).json({ error: 'Database error', detail: err.message });
    }
});

// Return the rank for a given score (1-based, higher score = better rank)
app.get('/api/rank', async (req, res) => {
    const score = Number(req.query.score);
    if (isNaN(score)) {
        res.status(400).json({ error: 'Missing or invalid score query param' });
        return;
    }
    try {
        const result = await pool.query(
            `SELECT COUNT(*) AS rank FROM scream_sessions WHERE final_score > $1`,
            [score]
        );
        const topScores = await pool.query(
            `SELECT id, team, final_score FROM scream_sessions ORDER BY final_score DESC LIMIT 5`
        );
        const rank = Number(result.rows[0].rank) + 1;
        console.log(`[Rank] query score=${score}, ahead=${result.rows[0].rank}, rank=${rank}`);
        console.log(`[Rank] top 5:`, topScores.rows);
        res.json({ rank });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Fetch leaderboard scores ordered by duration
app.get('/api/scores', async (_req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, team, scream_time_ms, peak_scream_db, final_score, image_url, nickname, created_at
       FROM scream_sessions
       ORDER BY final_score DESC
       LIMIT 100`
        );
        res.json(result.rows);
    } catch (err: any) {
        console.error('[DB] Query error:', err.message);
        res.status(500).json({ error: 'Database error' });
    }
});

// Photo landing page data — valid for 10 minutes after creation
app.get('/api/photo/:token', async (req, res) => {
    const { token } = req.params;
    if (!/^[0-9a-f]{64}$/.test(token)) {
        res.status(400).json({ error: 'Invalid token' });
        return;
    }
    try {
        const result = await pool.query(
            `SELECT id, team, scream_time_ms, peak_scream_db, image_url, token_expires_at, created_at
             FROM scream_sessions WHERE download_token = $1`,
            [token]
        );
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Not found' });
            return;
        }
        const row = result.rows[0];
        if (!row.token_expires_at || new Date(row.token_expires_at) < new Date()) {
            res.status(410).json({ error: 'This link has expired' });
            return;
        }
        res.json(row);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Proxy-download — valid for the same 10-minute window
app.get('/api/download/:token', async (req, res) => {
    const { token } = req.params;
    if (!/^[0-9a-f]{64}$/.test(token)) {
        res.status(400).json({ error: 'Invalid token' });
        return;
    }
    try {
        const result = await pool.query(
            `SELECT image_url, token_expires_at FROM scream_sessions WHERE download_token = $1`,
            [token]
        );
        const row = result.rows[0];
        if (!row?.image_url) {
            res.status(404).json({ error: 'Not found' });
            return;
        }
        if (!row.token_expires_at || new Date(row.token_expires_at) < new Date()) {
            res.status(410).json({ error: 'This link has expired' });
            return;
        }
        const imageUrl: string = row.image_url;
        const imageRes = await fetch(imageUrl);
        if (!imageRes.ok) {
            res.status(502).json({ error: 'Failed to fetch image from storage' });
            return;
        }
        const contentType = imageRes.headers.get('content-type') || 'image/jpeg';
        const ext = contentType.split('/')[1] || 'jpg';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="sound-clash-scream.${ext}"`);
        const buffer = await imageRes.arrayBuffer();
        res.send(Buffer.from(buffer));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ─── R2 public CDN proxy ──────────────────────────────────────────────────────
const R2_PUBLIC_BASE = 'https://pub-e12eb7874b084e1da7840ee4870ec95f.r2.dev';
app.get('/r2/{*splat}', async (req, res) => {
    try {
        const upstream = `${R2_PUBLIC_BASE}${req.path.replace(/^\/r2/, '')}`;
        const r2Res = await fetch(upstream);
        if (!r2Res.ok) {
            res.status(r2Res.status).end();
            return;
        }
        const contentType = r2Res.headers.get('content-type');
        if (contentType) res.setHeader('Content-Type', contentType);
        const cacheControl = r2Res.headers.get('cache-control');
        if (cacheControl) res.setHeader('Cache-Control', cacheControl);
        const buffer = await r2Res.arrayBuffer();
        res.send(Buffer.from(buffer));
    } catch (err: any) {
        console.error('[R2 Proxy]', err.message);
        res.status(502).end();
    }
});

// ─── Static frontend (production build) ──────────────────────────────────────
import fs from 'fs';
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));

    // Catch-all: serve index.html for any non-API route (client-side routing)
    app.get('/{*splat}', (_req, res) => {
        res.sendFile(path.join(distDir, 'index.html'));
    });
} else {
    console.log('[Server] No dist/ folder found — running in API-only mode (use Vite for frontend)');
}

// ─── Serial Port (optional — graceful degradation if WeMos not connected) ────
const SERIAL_PORT_PATH = process.env.SERIAL_PORT || '/dev/ttyUSB0';
const SERIAL_BAUD = Number(process.env.SERIAL_BAUD) || 115200;

interface LedCommand {
    state: 'idle' | 'monitoring' | 'tracking' | 'complete';
    team?: string;
    currentDb?: number;
    maxDb?: number;
}

function buildSerialMessage(cmd: LedCommand): string | null {
    switch (cmd.state) {
        case 'idle':       return 'IDLE';
        case 'monitoring': return cmd.team ? `MONITOR:${cmd.team}` : null;
        case 'tracking':   return (cmd.team && cmd.currentDb != null)
                               ? `TRACK:${cmd.team}:${String(Math.round(cmd.currentDb)).padStart(3, '0')}`
                               : null;
        case 'complete':   return (cmd.team && cmd.maxDb != null)
                               ? `COMPLETE:${cmd.team}:${String(Math.round(cmd.maxDb)).padStart(3, '0')}`
                               : null;
        default:           return null;
    }
}

let serialPort: any = null;

function writeSerial(message: string) {
    if (!serialPort || !serialPort.isOpen) return;
    serialPort.write(message + '\n', (err: any) => {
        if (err) console.error('[Serial] Write error:', err.message);
    });
}

async function initSerialPort() {
    if (!process.env.SERIAL_PORT) {
        console.log('[Serial] SERIAL_PORT not set — LED control disabled.');
        return;
    }
    try {
        const { SerialPort } = await import('serialport');
        const port = new SerialPort({ path: SERIAL_PORT_PATH, baudRate: SERIAL_BAUD, autoOpen: false });

        port.open((err: any) => {
            if (err) {
                console.warn(`[Serial] Could not open ${SERIAL_PORT_PATH}: ${err.message}`);
                console.warn('[Serial] LED control disabled — app continues normally.');
                return;
            }
            serialPort = port;
            console.log(`[Serial] Connected to ${SERIAL_PORT_PATH} at ${SERIAL_BAUD} baud`);
            writeSerial('IDLE');
        });

        port.on('error', (err: any) => {
            console.error('[Serial] Port error:', err.message);
            serialPort = null;
        });

        port.on('close', () => {
            console.warn('[Serial] Port closed unexpectedly');
            serialPort = null;
        });
    } catch (err: any) {
        console.warn('[Serial] SerialPort load failed:', err.message);
        console.warn('[Serial] LED control disabled — app continues normally.');
    }
}

// ─── HTTP + WebSocket Server ──────────────────────────────────────────────────
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws: WebSocket, req) => {
    const ip = req.socket.remoteAddress;
    console.log(`[WS] Client connected from ${ip}`);

    ws.on('message', (data) => {
        try {
            const cmd = JSON.parse(data.toString()) as LedCommand;
            const msg = buildSerialMessage(cmd);
            if (msg) writeSerial(msg);
        } catch {
            // ignore malformed messages
        }
    });

    ws.on('close', () => {
        console.log('[WS] Client disconnected — resetting LEDs to IDLE');
        writeSerial('IDLE');
    });
});

initSerialPort();

// ─── Start ────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
    console.log(`[API] Sound Clash server running on http://localhost:${PORT}`);
});
