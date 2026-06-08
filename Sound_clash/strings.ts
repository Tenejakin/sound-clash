// ─── UI Strings ───────────────────────────────────────────────────────────────
// Edit this file to update all visible text in the app without touching component code.

export const S = {

  // ── Header ──────────────────────────────────────────────────────────────────
  TEAM_RED:                  'Червен отбор',
  TEAM_BLUE:                 'Син отбор',
  FOOTER:                    'SAIASUITE 2026',

  // ── Splash / idle screen ─────────────────────────────────────────────────────
  TOUCH_TO_START:            'Докосни за начало',

  // ── Nickname screen ──────────────────────────────────────────────────────────
  NICKNAME_TITLE:            'Твоят прякор',
  NICKNAME_PLACEHOLDER:      'Въведи прякор',
  NICKNAME_SUBMIT:           'НАПРЕД',

  // ── Team selection screen ────────────────────────────────────────────────────
  SELECT_PROMPT:             'SELECT YOUR FREQUENCY',
  SELECT_TITLE:              'ИЗБЕРИ СВОЯ ОТБОР',
  TEAM_RED_BAND:             'SIDDHARTA',
  TEAM_BLUE_BAND:            'BIG FOOT MAMA',
  VS_LABEL:                  'VS',

  // ── Connecting transition (while getUserMedia initialises) ───────────────────
  CONNECTING:                'ИНИЦИАЛИЗИРАНЕ НА СЕНЗОРИТЕ',

  // ── Monitoring header bar ────────────────────────────────────────────────────
  STATUS_MONITORING:         'НАБЛЮДЕНИЕ_АКТИВНО',
  DB_SYNCING:                '● СИНХРОНИЗИРАНЕ НА БАЗАТА',
  DB_ERROR:                  '✗ DB ERROR',

  // ── Countdown ────────────────────────────────────────────────────────────────
  COUNTDOWN_SCREAM:          'КРЕЩИ!',

  // ── While waiting for scream to start ────────────────────────────────────────
  SCANNING:                  'ТЪРСЕНЕ НА ТОЧКИ НА ПРОБИВ',

  // ── Score / results ──────────────────────────────────────────────────────────
  LABEL_SCORE:               'РЕЗУЛТАТ',
  LABEL_YOUR_POINTS:         'Твоите точки:',
  LABEL_PEAK:                'Връх на вика:',
  LABEL_TIME:                'Времетраене на вика:',
  LABEL_RANK:                'Глобална класация:',
  LABEL_RANK_SUFFIX:         '. място',
  UNIT_DB:                   'db',
  UNIT_SECONDS:              's',
  SCREAM_LOADING:            'Твоят вик беше в топ 1%',

  // ── QR / download section ────────────────────────────────────────────────────
  QR_HEADING:                'Изтегли своя резултат',
  QR_CTA:                    'СКАНИРАЙ ЗА ИЗТЕГЛЯНЕ',

  // ── Reset button ─────────────────────────────────────────────────────────────
  BTN_RESET:                 'НУЛИРАЙ',

  // ── JotForm screen ───────────────────────────────────────────────────────────
  JOTFORM_TITLE:             'Регистрация',
  JOTFORM_SKIP:              'Не желая да участвам',

  // ── Image capture overlay ────────────────────────────────────────────────────
  captureLabel: (db: number) => `Sustained ${db.toFixed(1)} dB Breach`,

  // ── Result card image (canvas) ───────────────────────────────────────────────
  CANVAS_LABEL_POINTS:       'Моите точки:',
  CANVAS_LABEL_TIME:         'Времетраене на вика:',
  CANVAS_LABEL_PEAK:         'Връх на вика:',

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
  METER_DECIBELS_LABEL:      'ДЕЦИБЕЛИ',
  METER_THRESHOLD_BREACH:    'ПРАГЪТ Е ПРЕВИШЕН',
  METER_LISTENING:           'СЛУШАНЕ',

  // ── Leaderboard ──────────────────────────────────────────────────────────────
  LB_TITLE:                  'КЛАСАЦИЯ',
  LB_LIVE:                   'LIVE_FEED',
  LB_EMPTY:                  'NO DATA DETECTED',
  lbTeamLabel: (team: string) => `TEAM ${team}`,

} as const;
