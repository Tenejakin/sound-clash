// ─── UI Strings ───────────────────────────────────────────────────────────────
// Edit this file to update all visible text in the app without touching component code.

export const S = {

  // ── Header ──────────────────────────────────────────────────────────────────
  TEAM_RED:                  'Skuadra e kuqe',
  TEAM_BLUE:                 'Skuadra blu',
  FOOTER:                    'SAIASUITE 2026',

  // ── Splash / idle screen ─────────────────────────────────────────────────────
  TOUCH_TO_START:            'Prek për të filluar',

  // ── Nickname screen ──────────────────────────────────────────────────────────
  NICKNAME_TITLE:            'Pseudonimi yt',
  NICKNAME_PLACEHOLDER:      'Shkruaj pseudonimin',
  NICKNAME_SUBMIT:           'VAZHDO',

  // ── Team selection screen ────────────────────────────────────────────────────
  SELECT_PROMPT:             'SELECT YOUR FREQUENCY',
  SELECT_TITLE:              'ZGJIDH SKUADRËN TËNDE',
  TEAM_RED_BAND:             'SIDDHARTA',
  TEAM_BLUE_BAND:            'BIG FOOT MAMA',
  VS_LABEL:                  'VS',

  // ── Connecting transition (while getUserMedia initialises) ───────────────────
  CONNECTING:                'INICIALIZIMI I SENSORËVE',

  // ── Monitoring header bar ────────────────────────────────────────────────────
  STATUS_MONITORING:         'MONITORIMI_AKTIV',
  DB_SYNCING:                '● SINKRONIZIM I BAZËS',
  DB_ERROR:                  '✗ DB ERROR',

  // ── Countdown ────────────────────────────────────────────────────────────────
  COUNTDOWN_SCREAM:          'BËRTIT!',

  // ── While waiting for scream to start ────────────────────────────────────────
  SCANNING:                  'DUKE KËRKUAR PIKAT E SHPËRTHIMIT',

  // ── Score / results ──────────────────────────────────────────────────────────
  LABEL_SCORE:               'REZULTATI',
  LABEL_YOUR_POINTS:         'Pikët e tua:',
  LABEL_PEAK:                'Kulmi i britmës:',
  LABEL_TIME:                'Kohëzgjatja e britmës:',
  LABEL_RANK:                'Renditja globale:',
  LABEL_RANK_SUFFIX:         '. vend',
  UNIT_DB:                   'db',
  UNIT_SECONDS:              's',
  SCREAM_LOADING:            'Britma jote ishte në top 1%',

  // ── QR / download section ────────────────────────────────────────────────────
  QR_HEADING:                'Shkarko rezultatin tënd',
  QR_CTA:                    'SKANO PËR TË SHKARKUAR',

  // ── Reset button ─────────────────────────────────────────────────────────────
  BTN_RESET:                 'RIVENDOS',

  // ── JotForm screen ───────────────────────────────────────────────────────────
  JOTFORM_TITLE:             'Regjistrimi',
  JOTFORM_SKIP:              'Nuk dua të marr pjesë',

  // ── Image capture overlay ────────────────────────────────────────────────────
  captureLabel: (db: number) => `Sustained ${db.toFixed(1)} dB Breach`,

  // ── Result card image (canvas) ───────────────────────────────────────────────
  CANVAS_LABEL_POINTS:       'Pikët e mia:',
  CANVAS_LABEL_TIME:         'Kohëzgjatja e britmës:',
  CANVAS_LABEL_PEAK:         'Kulmi i britmës:',

  // ── Photo (QR download) page ────────────────────────────────────────────────
  PHOTO_LOADING:             'Loading…',
  PHOTO_LINK_EXPIRED:        'Link Expired',
  PHOTO_LINK_EXPIRED_BODY:   'This download link is only valid for 10 minutes after the scream.',
  PHOTO_LINK_NOT_FOUND:      'Link not found',
  PHOTO_TIME:                'Time',
  PHOTO_PEAK:                'Peak',
  PHOTO_UNIT_DB:             'dB',
  PHOTO_UNIT_SECONDS:        's',
  PHOTO_DOWNLOAD:            'DOWNLOAD',
  PHOTO_FOOTER:              'RED BULL SOUNDCLASH',
  photoTeamLabel: (team: string) => team === 'red' ? 'RED TEAM' : 'BLUE TEAM',

  // ── Decibel meter ────────────────────────────────────────────────────────────
  METER_DECIBELS_LABEL:      'DECIBELË',
  METER_THRESHOLD_BREACH:    'PRAGU U TEJKALUA',
  METER_LISTENING:           'DUKE DËGJUAR',

  // ── Leaderboard ──────────────────────────────────────────────────────────────
  LB_TITLE:                  'KLASIFIKIMI',
  LB_LIVE:                   'LIVE_FEED',
  LB_EMPTY:                  'NO DATA DETECTED',
  lbTeamLabel: (team: string) => `TEAM ${team}`,

} as const;
