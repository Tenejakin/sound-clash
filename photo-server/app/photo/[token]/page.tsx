import { notFound } from 'next/navigation';
import pool from '@/lib/db';

interface Row {
  team: string;
  peak_scream_db: number;
  scream_time_ms: number;
  final_score: number;
  image_url: string;
  token_expires_at: Date | null;
}

export default async function PhotoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  if (!/^[0-9a-f]{64}$/.test(token)) notFound();

  const result = await pool.query<Row>(
    `SELECT team, peak_scream_db, scream_time_ms, final_score, image_url, token_expires_at
     FROM scream_sessions WHERE download_token = $1`,
    [token]
  );

  if (!result.rows[0]) notFound();

  const row = result.rows[0];
  const expired = !row.token_expires_at || new Date(row.token_expires_at) < new Date();

  if (expired) {
    return (
      <main style={styles.center}>
        <img
          src="https://pub-e12eb7874b084e1da7840ee4870ec95f.r2.dev/Logo.png"
          alt="Sound Clash"
          style={styles.logo}
        />
        <h1 style={{ fontSize: '1.75rem', color: '#ff4444', marginBottom: '0.75rem' }}>Link Expired</h1>
        <p style={{ color: '#888', maxWidth: '300px', lineHeight: 1.5 }}>
          This photo link is only valid for 10 minutes after your session. Ask the operator to resend it.
        </p>
      </main>
    );
  }

  const durationSec = (row.scream_time_ms / 1000).toFixed(1);

  return (
    <main style={styles.page}>
      <img
        src="https://pub-e12eb7874b084e1da7840ee4870ec95f.r2.dev/Logo.png"
        alt="Sound Clash"
        style={styles.logo}
      />

      <img
        src={row.image_url}
        alt="Your scream photo"
        style={styles.photo}
      />

      <div style={styles.grid}>
        <Stat label="Team" value={row.team} />
        <Stat label="Peak dB" value={`${Number(row.peak_scream_db).toFixed(1)} dB`} />
        <Stat label="Duration" value={`${durationSec}s`} />
        <Stat label="Score" value={Number(row.final_score).toLocaleString()} />
      </div>

      <a href={`/api/download/${token}`} style={styles.button}>
        Download Photo
      </a>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.stat}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: '540px',
    margin: '0 auto',
    padding: '1.5rem 1rem 3rem',
    textAlign: 'center' as const,
  },
  center: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '2rem',
    textAlign: 'center' as const,
  },
  logo: {
    height: '56px',
    marginBottom: '1.5rem',
    objectFit: 'contain' as const,
  },
  photo: {
    width: '100%',
    borderRadius: '12px',
    display: 'block',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
    margin: '1.25rem 0',
  },
  stat: {
    background: '#1a1a1a',
    borderRadius: '10px',
    padding: '0.875rem',
  },
  statLabel: {
    color: '#888',
    fontSize: '0.7rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  statValue: {
    fontSize: '1.2rem',
    fontWeight: 700,
    marginTop: '0.25rem',
  },
  button: {
    display: 'block',
    background: '#e8c14e',
    color: '#000',
    padding: '1rem',
    borderRadius: '10px',
    fontWeight: 700,
    fontSize: '1.05rem',
    textDecoration: 'none',
    marginTop: '0.5rem',
  },
} as const;
