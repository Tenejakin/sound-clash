import React, { useEffect, useState } from 'react';

const BACKGROUND_URL = import.meta.env.VITE_BACKGROUND_URL || '/r2/app_bg_final.png';

interface PhotoData {
  id: number;
  team: string;
  scream_time_ms: number;
  peak_scream_db: number;
  image_url: string;
  created_at: string;
}

type PageState = 'loading' | 'ok' | 'used' | 'not_found' | 'error';

const PhotoPage: React.FC = () => {
  const [photo, setPhoto] = useState<PhotoData | null>(null);
  const [state, setState] = useState<PageState>('loading');

  const token = window.location.pathname.split('/photo/')[1]?.split('/')[0] ?? '';

  useEffect(() => {
    if (!token || !/^[0-9a-f]{64}$/.test(token)) {
      setState('not_found');
      return;
    }
    fetch(`/api/photo/${token}`)
      .then(async r => {
        if (r.status === 410) { setState('used'); return; }
        if (r.status === 404) { setState('not_found'); return; }
        if (!r.ok) { setState('error'); return; }
        const data: PhotoData = await r.json();
        setPhoto(data);
        setState('ok');
      })
      .catch(() => setState('error'));
  }, [token]);

  const teamColor = photo?.team === 'red' ? '#ef4444' : '#3b82f6';
  const teamLabel = photo?.team === 'red' ? 'RED TEAM' : 'BLUE TEAM';

  const bgStyle: React.CSSProperties = {
    backgroundImage: `url('${BACKGROUND_URL}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
  };

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={bgStyle}>
        <div className="absolute inset-0 bg-black/40" />
        <p className="relative text-white/60 text-sm font-black uppercase tracking-widest animate-pulse">Loading…</p>
      </div>
    );
  }

  if (state === 'used') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center relative" style={bgStyle}>
        <div className="absolute inset-0 bg-black/50" />
        <p className="relative text-5xl">⏱</p>
        <p className="relative text-white font-black text-xl uppercase tracking-widest">Link Expired</p>
        <p className="relative text-white/60 text-sm font-bold uppercase tracking-widest max-w-xs">
          This download link is only valid for 10 minutes after the scream.
        </p>
      </div>
    );
  }

  if (state === 'not_found' || state === 'error' || !photo) {
    return (
      <div className="min-h-screen flex items-center justify-center relative" style={bgStyle}>
        <div className="absolute inset-0 bg-black/50" />
        <p className="relative text-white/60 text-sm font-black uppercase tracking-widest">Link not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative" style={bgStyle}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="/r2//Logo.png"
            alt="Sound Clash"
            className="h-12 w-auto opacity-80"
          />
        </div>

        {/* Result image */}
        <div className="relative overflow-hidden rounded-2xl border border-white/20 shadow-2xl aspect-[9/16] mb-6">
          <img src={photo.image_url} alt="Your scream" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
          <div
            className="absolute bottom-4 left-4 right-4 text-xs font-black uppercase tracking-widest"
            style={{ color: teamColor }}
          >
            {teamLabel}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/10 p-5 rounded-xl text-center border border-white/10">
            <p className="text-xs text-white/40 font-bold uppercase tracking-widest mb-1">Time</p>
            <p className="text-4xl font-black text-white">
              {(photo.scream_time_ms / 1000).toFixed(2)}
              <span className="text-sm ml-1 opacity-40">s</span>
            </p>
          </div>
          <div className="bg-white/10 p-5 rounded-xl text-center border border-white/10">
            <p className="text-xs text-white/40 font-bold uppercase tracking-widest mb-1">Peak</p>
            <p className="text-4xl font-black text-white">
              {Math.round(photo.peak_scream_db)}
              <span className="text-sm ml-1 opacity-40">dB</span>
            </p>
          </div>
        </div>

        {/* Download button */}
        <a
          href={`/api/download/${token}`}
          download="sound-clash-scream.jpg"
          className="block w-full text-center py-5 rounded-2xl text-white font-black text-xl tracking-[0.3em] uppercase shadow-2xl transition-transform hover:scale-[1.02] active:scale-95"
          style={{ backgroundColor: teamColor }}
        >
          DOWNLOAD
        </a>

        <p className="mt-8 text-center text-xs text-white/20 font-black uppercase tracking-widest">
           RED BULL SOUNDCLASH
        </p>
      </div>
    </div>
  );
};

export default PhotoPage;
