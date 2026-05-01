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
  CONNECTING:                'INICIALIZACIJA SENZORJEV',

  // ── Monitoring header bar ────────────────────────────────────────────────────
  STATUS_MONITORING:         'NADZOR_AKTIVEN',
  DB_SYNCING:                '● SINHRONIZACIJA BAZE',
  DB_ERROR:                  '✗ DB ERROR',

  // ── Countdown ────────────────────────────────────────────────────────────────
  COUNTDOWN_SCREAM:          'KRIČI!',

  // ── While waiting for scream to start ────────────────────────────────────────
  SCANNING:                  'ISKANJE TOČK PREBOJA',

  // ── Score / results ──────────────────────────────────────────────────────────
  LABEL_SCORE:               'REZULTAT',
  LABEL_YOUR_POINTS:         'Tvoje točke:',
  LABEL_PEAK:                'Vrhunec krika:',
  LABEL_TIME:                'Trajanje krika:',
  LABEL_RANK:                'Globalna uvrstitev:',
  LABEL_RANK_SUFFIX:         '. mesto',
  UNIT_DB:                   'db',
  UNIT_SECONDS:              's',
  SCREAM_LOADING:            'Tvoj krik je bil med top 1%',

  // ── QR / download section ────────────────────────────────────────────────────
  QR_HEADING:                'Prenesi svoj rezultat',
  QR_CTA:                    'SKENIRAJ ZA PRENOS',

  // ── Reset button ─────────────────────────────────────────────────────────────
  BTN_RESET:                 'PONASTAVI',

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
  METER_DECIBELS_LABEL:      'DECIBELI',
  METER_THRESHOLD_BREACH:    'PRESEŽEN PRAG',
  METER_LISTENING:           'POSLUŠANJE',

  // ── Leaderboard ──────────────────────────────────────────────────────────────
  LB_TITLE:                  'LESTVICA',
  LB_LIVE:                   'LIVE_FEED',
  LB_EMPTY:                  'NO DATA DETECTED',
  lbTeamLabel: (team: string) => `TEAM ${team}`,

} as const;
