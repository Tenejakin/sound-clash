import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  if (!/^[0-9a-f]{64}$/.test(token)) {
    return new NextResponse('Invalid token', { status: 400 });
  }

  const result = await pool.query(
    `SELECT image_url, token_expires_at FROM scream_sessions WHERE download_token = $1`,
    [token]
  );

  const row = result.rows[0];
  if (!row?.image_url) return new NextResponse('Not found', { status: 404 });
  if (!row.token_expires_at || new Date(row.token_expires_at) < new Date()) {
    return new NextResponse('Link expired', { status: 410 });
  }

  const imageRes = await fetch(row.image_url as string);
  if (!imageRes.ok) return new NextResponse('Failed to fetch image', { status: 502 });

  const contentType = imageRes.headers.get('content-type') ?? 'image/jpeg';
  const ext = contentType.includes('png') ? 'png' : 'jpg';

  return new NextResponse(imageRes.body, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="sound-clash-scream.${ext}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
