// ─── UI Strings ───────────────────────────────────────────────────────────────
// Edit this file to update all visible text in the app without touching component code.

export const S = {

  // ── Header ──────────────────────────────────────────────────────────────────
  TEAM_RED:                  'Ekipi i Kuq',
  TEAM_BLUE:                 'Ekipi i Kaltër',
  FOOTER:                    'SAIASUITE 2026',

  // ── Splash / idle screen ─────────────────────────────────────────────────────
  TOUCH_TO_START:            'Prek për të filluar',

  // ── Nickname screen ──────────────────────────────────────────────────────────
  NICKNAME_TITLE:            'Nofka juaj',
  NICKNAME_PLACEHOLDER:      'Vendos nofken tuaj',
  NICKNAME_SUBMIT:           'Vazhdo',

  // ── Team selection screen ────────────────────────────────────────────────────
  SELECT_PROMPT:             'ZGJIDH FREKUENCËN TËNDE',
  SELECT_TITLE:              'ZGJIDH EKIPIN TËND',
  TEAM_RED_BAND:             'SIDDHARTA',
  TEAM_BLUE_BAND:            'BIG FOOT MAMA',
  VS_LABEL:                  'VS',

  // ── Connecting transition (while getUserMedia initialises) ───────────────────
  CONNECTING:                'Aktivizimi i sensorëve',

  // ── Monitoring header bar ────────────────────────────────────────────────────
  STATUS_MONITORING:         'Aktivizimi i Monitorit',
  DB_SYNCING:                '● Po sinkronizohen të dhënat',
  DB_ERROR:                  '✗ Gabim në bazën e të dhënave',

  // ── Countdown ────────────────────────────────────────────────────────────────
  COUNTDOWN_SCREAM:          'BËRTIT!',

  // ── While waiting for scream to start ────────────────────────────────────────
  SCANNING:                  'Po analizohen pikat e tejkalimit',

  // ── Score / results ──────────────────────────────────────────────────────────
  LABEL_SCORE:               'Rezultati',
  LABEL_YOUR_POINTS:         'Pikët e tua:',
  LABEL_PEAK:                'Kulmi i zërit:',
  LABEL_TIME:                'Kohëzgjatja e britmës:',
  LABEL_RANK:                'Renditja globale:',
  LABEL_RANK_SUFFIX:         '. vend',
  UNIT_DB:                   'db',
  UNIT_SECONDS:              's',
  SCREAM_LOADING:            'Britma jote ishte në 1% më të mirat',

  // ── QR / download section ────────────────────────────────────────────────────
  QR_HEADING:                'Shkarko rezultatin tënd',
  QR_CTA:                    'Skano për ta shkarkuar',

  // ── Reset button ─────────────────────────────────────────────────────────────
  BTN_RESET:                 'Rivendos',

  // ── JotForm screen ───────────────────────────────────────────────────────────
  JOTFORM_TITLE:             'Dërgo',
  JOTFORM_SKIP:              'Nuk dua të marr pjesë',

  // ── Image capture overlay ────────────────────────────────────────────────────
  captureLabel: (db: number) => `Tejkalim i vazhdueshëm prej ${db.toFixed(1)} dB`,

  // ── Result card image (canvas) ───────────────────────────────────────────────
  CANVAS_LABEL_POINTS:       'Pikët e mia:',
  CANVAS_LABEL_TIME:         'Kohëzgjatja e britmës:',
  CANVAS_LABEL_PEAK:         'Kulmi i zërit:',

  // ── Photo (QR download) page ────────────────────────────────────────────────
  PHOTO_LOADING:             'Duke u ngarkuar...',
  PHOTO_LINK_EXPIRED:        'Link ka skaduar',
  PHOTO_LINK_EXPIRED_BODY:   'Ky link për shkarkim është valid për vetëm 10 minuta pas britmës.',
  PHOTO_LINK_NOT_FOUND:      'Link nuk u gjet',
  PHOTO_TIME:                'Koha',
  PHOTO_PEAK:                'Kulmi',
  PHOTO_UNIT_DB:             'dB',
  PHOTO_UNIT_SECONDS:        's',
  PHOTO_DOWNLOAD:            'SHKARKO',
  PHOTO_FOOTER:              'RED BULL SOUNDCLASH',
  photoTeamLabel: (team: string) => team === 'red' ? 'EKIPI I KUQ' : 'EKIPI I KALTËR',

  // ── Decibel meter ────────────────────────────────────────────────────────────
  METER_DECIBELS_LABEL:      'DECIBELËT',
  METER_THRESHOLD_BREACH:    'TEJKALIMI I PRAGUT',
  METER_LISTENING:           'DUKE DËGJUAR',

  // ── Leaderboard ──────────────────────────────────────────────────────────────
  LB_TITLE:                  'RENDITJA',
  LB_LIVE:                   'TRANSMETIM LIVE',
  LB_EMPTY:                  'NUK U DETEKTUAN TË DHËNA',
  lbTeamLabel: (team: string) => `EKIPI ${team}`,

} as const;
