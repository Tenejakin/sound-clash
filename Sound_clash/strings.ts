// ─── UI Strings ───────────────────────────────────────────────────────────────
// Edit this file to update all visible text in the app without touching component code.

export const S = {

  // ── Header ──────────────────────────────────────────────────────────────────
  TEAM_RED:                  'Червен отбор',
  TEAM_BLUE:                 'Син отбор',
  FOOTER:                    'SAIASUITE 2026',

  // ── Splash / idle screen ─────────────────────────────────────────────────────
  TOUCH_TO_START:            'Натисни, за да започне',

  // ── Nickname screen ──────────────────────────────────────────────────────────
  NICKNAME_TITLE:            'Името ти',
  NICKNAME_PLACEHOLDER:      'Въведи името си',
  NICKNAME_SUBMIT:           'Следващ',

  // ── Team selection screen ────────────────────────────────────────────────────
  SELECT_PROMPT:             'ИЗБЕРИ ЧЕСТОТА',
  SELECT_TITLE:              'ИЗБЕРИ ОТБОР',
  TEAM_RED_BAND:             'SIDDHARTA',
  TEAM_BLUE_BAND:            'BIG FOOT MAMA',
  VS_LABEL:                  'СРЕЩУ',

  // ── Connecting transition (while getUserMedia initialises) ───────────────────
  CONNECTING:                'АКТИВИРАНЕ НА СЕНЗОРИТЕ',

  // ── Monitoring header bar ────────────────────────────────────────────────────
  STATUS_MONITORING:         'ЕКРАНА Е АКТИВЕН',
  DB_SYNCING:                '● СИНХРОНИЗИРАНЕ НА БАЗА ДАННИ',
  DB_ERROR:                  '✗ ГРЕШКА В БАЗАТА ДАННИ',

  // ── Countdown ────────────────────────────────────────────────────────────────
  COUNTDOWN_SCREAM:          'КРЕЩИ!',

  // ── While waiting for scream to start ────────────────────────────────────────
  SCANNING:                  'СКАНИРАНЕ ЗА ТОЧКИ НА ПРОБИВ',

  // ── Score / results ──────────────────────────────────────────────────────────
  LABEL_SCORE:               'РЕЗУЛТАТ',
  LABEL_YOUR_POINTS:         'Твоите точки:',
  LABEL_PEAK:                'Пик на писъка:',
  LABEL_TIME:                'Продължителност на писъка:',
  LABEL_RANK:                'Глобална класация:',
  LABEL_RANK_SUFFIX:         '. място',
  UNIT_DB:                   'db',
  UNIT_SECONDS:              's',
  SCREAM_LOADING:            'Писъкът ти беше сред най-добрите 1%',

  // ── QR / download section ────────────────────────────────────────────────────
  QR_HEADING:                'Изтегли резултата си',
  QR_CTA:                    'СКАНИРАЙ, ЗА ДА ИЗТЕГЛИШ',

  // ── Reset button ─────────────────────────────────────────────────────────────
  BTN_RESET:                 'РЕСТАРТ',

  // ── JotForm screen ───────────────────────────────────────────────────────────
  JOTFORM_TITLE:             'Изпрати',
  JOTFORM_SKIP:              'Не искам да участвам',

  // ── Image capture overlay ────────────────────────────────────────────────────
  captureLabel: (db: number) => `Продължително надвишаване на ${db.toFixed(1)} dB`,

  // ── Result card image (canvas) ───────────────────────────────────────────────
  CANVAS_LABEL_POINTS:       'Моите точки:',
  CANVAS_LABEL_TIME:         'Продължителност на писъка:',
  CANVAS_LABEL_PEAK:         'Пик на писъка:',

  // ── Photo (QR download) page ────────────────────────────────────────────────
  PHOTO_LOADING:             'Зарежда се...',
  PHOTO_LINK_EXPIRED:        'Линкът е изтекъл',
  PHOTO_LINK_EXPIRED_BODY:   'Този линк е активен само 10 мин. след писъка.',
  PHOTO_LINK_NOT_FOUND:      'Линкът не е намерен',
  PHOTO_TIME:                'Време',
  PHOTO_PEAK:                'Пик',
  PHOTO_UNIT_DB:             'dB',
  PHOTO_UNIT_SECONDS:        's',
  PHOTO_DOWNLOAD:            'СВАЛИ',
  PHOTO_FOOTER:              'RED BULL SOUNDCLASH',
  photoTeamLabel: (team: string) => team === 'red' ? 'ЧЕРВЕН ОТБОР' : 'СИН ОТБОР',

  // ── Decibel meter ────────────────────────────────────────────────────────────
  METER_DECIBELS_LABEL:      'ДЕЦИБЕЛИ',
  METER_THRESHOLD_BREACH:    'ПРЕВИШАВАНЕ НА ПРАГА',
  METER_LISTENING:           'СЛУШАНЕ',

  // ── Leaderboard ──────────────────────────────────────────────────────────────
  LB_TITLE:                  'КЛАСИРАНЕ',
  LB_LIVE:                   'НА ЖИВО',
  LB_EMPTY:                  'НЕ СА ОТКРИТИ ДАННИ',
  lbTeamLabel: (team: string) => `ОТБОР ${team}`,

} as const;
