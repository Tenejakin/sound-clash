import { notFound } from 'next/navigation';
import pool from '@/lib/db';

interface Row {
  image_url: string;
  token_expires_at: Date | null;
}

const BACKGROUND_URL = 'https://pub-e12eb7874b084e1da7840ee4870ec95f.r2.dev/app_bg_final.png';

export default async function PhotoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  if (!/^[0-9a-f]{64}$/.test(token)) notFound();

  const result = await pool.query<Row>(
    `SELECT image_url, token_expires_at
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
        <h1 style={{ fontSize: '1.75rem', color: '#ff4444', marginBottom: '0.75rem' }}>Link ka skaduar</h1>
        <p style={{ color: '#888', maxWidth: '300px', lineHeight: 1.5 }}>
          Ky link për shkarkim është valid për vetëm 10 minuta pas britmës.
        </p>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <img
        src={row.image_url}
        alt="Your scream photo"
        style={styles.photo}
      />

      <a href={`/api/download/${token}`} style={styles.button}>
        SHKARKO
      </a>
    </main>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    padding: '1.5rem 1rem 3rem',
    textAlign: 'center' as const,
    backgroundImage: `url('${BACKGROUND_URL}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1.25rem',
  },
  center: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '2rem',
    textAlign: 'center' as const,
    backgroundImage: `url('${BACKGROUND_URL}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
  },
  logo: {
    height: '56px',
    marginBottom: '1.5rem',
    objectFit: 'contain' as const,
  },
  photo: {
    width: '100%',
    maxWidth: '540px',
    borderRadius: '12px',
    display: 'block',
  },
  button: {
    display: 'block',
    width: '100%',
    maxWidth: '540px',
    background: 'rgb(210,0,60)',
    color: '#fff',
    padding: '1rem',
    borderRadius: '10px',
    fontWeight: 700,
    fontSize: '1.05rem',
    textDecoration: 'none',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
} as const;
