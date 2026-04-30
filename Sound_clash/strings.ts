// ─── UI Strings ───────────────────────────────────────────────────────────────
// Edit this file to update all visible text in the app without touching component code.

export const S = {

  // ── Header ──────────────────────────────────────────────────────────────────
  TEAM_RED:                  'Rdeča ekipa',
  TEAM_BLUE:                 'Modra ekipa',
  FOOTER:                    'SAIASUITE 2026',

  // ── Splash / idle screen ─────────────────────────────────────────────────────
  TOUCH_TO_START:            'Dotakni se za začetek',

  // ── Nickname screen ──────────────────────────────────────────────────────────
  NICKNAME_TITLE:            'Tvoj vzdevek',
  NICKNAME_PLACEHOLDER:      'Vnesi vzdevek',
  NICKNAME_SUBMIT:           'NAPREJ',

  // ── Team selection screen ────────────────────────────────────────────────────
  SELECT_PROMPT:             'SELECT YOUR FREQUENCY',
  SELECT_TITLE:              'IZBERI SVOJO EKIPO',
  TEAM_RED_BAND:             'SIDDHARTA',
  TEAM_BLUE_BAND:            'BIG FOOT MAMA',
  VS_LABEL:                  'VS',

  // ── Connecting transition (while getUserMedia initialises) ───────────────────
  CONNECTING:                'INITIALIZING SENSORS',

  // ── Monitoring header bar ────────────────────────────────────────────────────
  STATUS_MONITORING:         'MONITOR_ACTIVE',
  DB_SYNCING:                '● SYNCING DB',
  DB_ERROR:                  '✗ DB ERROR',

  // ── Countdown ────────────────────────────────────────────────────────────────
  COUNTDOWN_SCREAM:          'SCREAM!',

  // ── While waiting for scream to start ────────────────────────────────────────
  SCANNING:                  'SCANNING_BREACH_POINTS',

  // ── Score / results ──────────────────────────────────────────────────────────
  LABEL_SCORE:               'SCORE',
  LABEL_YOUR_POINTS:         'Tvoje točke:',
  LABEL_PEAK:                'Vrhunec krika:',
  LABEL_TIME:                'Trajanje krika:',
  LABEL_RANK:                'Global ranking:',
  LABEL_RANK_SUFFIX:         '. mesto',
  UNIT_DB:                   'db',
  UNIT_SECONDS:              's',
  SCREAM_LOADING:            'Your scream was top 1%',

  // ── QR / download section ────────────────────────────────────────────────────
  QR_HEADING:                'Prenesi svoj rezultat',
  QR_CTA:                    'SCAN TO DOWNLOAD',

  // ── Reset button ─────────────────────────────────────────────────────────────
  BTN_RESET:                 'RESET',

  // ── JotForm screen ───────────────────────────────────────────────────────────
  JOTFORM_TITLE:             'Prijava',
  JOTFORM_SKIP:              'Ne želim sodelovati',

  // ── Image capture overlay ────────────────────────────────────────────────────
  captureLabel: (db: number) => `Sustained ${db.toFixed(1)} dB Breach`,

  // ── Result card image (canvas) ───────────────────────────────────────────────
  CANVAS_LABEL_POINTS:       'Moje točke:',
  CANVAS_LABEL_TIME:         'Trajanje krika:',
  CANVAS_LABEL_PEAK:         'Vrhunec krika:',

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
  METER_DECIBELS_LABEL:      'DECIBELS',
  METER_THRESHOLD_BREACH:    'THRESHOLD BREACH',
  METER_LISTENING:           'LISTENING',

  // ── Leaderboard ──────────────────────────────────────────────────────────────
  LB_TITLE:                  'RANKINGS',
  LB_LIVE:                   'LIVE_FEED',
  LB_EMPTY:                  'NO DATA DETECTED',
  lbTeamLabel: (team: string) => `TEAM ${team}`,

} as const;
