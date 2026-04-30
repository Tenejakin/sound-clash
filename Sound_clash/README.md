<div align="center">
  <img width="1200" height="475" alt="Sound Clash Banner" src="https://pub-e12eb7874b084e1da7840ee4870ec95f.r2.dev/soundclash-logo.avif" />
</div>

# Sound Clash — Red vs Blue

**Sound Clash** is a real-time scream competition app built for live events. Two teams compete to produce the loudest and most sustained scream. The app measures decibels via the microphone, captures a photo at peak moment, composites a shareable result card, and persists scores to a PostgreSQL database with cloud image storage on Cloudflare R2.

---

## Features

- **Red vs Blue team selection** — players pick a side before screaming
- **Real-time decibel meter** — `AudioContext` sampled at 60 Hz with RMS calculation
- **Automatic start/stop logic** — tracking starts at 95 dB, sustains above 85 dB, stops after 200 ms of silence
- **Camera capture** — grabs a frame the instant the scream threshold is crossed
- **Result card composition** — overlays team colour, score, peak dB, duration, and logo onto the captured frame (1080×1920, 9:16)
- **QR code download** — generates a time-limited (10 min) token so the user can scan and download their card
- **PostgreSQL persistence** — all runs saved server-side with full stats
- **Cloudflare R2 image storage** — composed result cards uploaded and served via public CDN URL
- **Live leaderboard** — ranked by `score = peak_dB × duration_seconds × multiplier`
- **LED control via WebSocket + Serial** — optional WeMos/Arduino integration for physical LED feedback synced to the scream state

---

## Architecture

```
Browser (React + Vite :3878)
  │
  ├── /api/*   ──proxy──►  Express API server (:4000)
  │                            ├── PostgreSQL  (scores)
  │                            └── Cloudflare R2  (images)
  │
  └── WebSocket (:4000) ──►  LED controller (optional Serial/WeMos)
```

| Layer | Tech |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS, Vite |
| Backend | Express 5, tsx, Node.js |
| Database | PostgreSQL (via `pg`) |
| Image storage | Cloudflare R2 (S3-compatible) |
| Real-time | WebSocket (`ws`) |
| LED hardware | WeMos D1 / Arduino via SerialPort (optional) |

---

## Scoring

```
score = peak_dB × (duration_ms / 1000) × SCORE_MULTIPLIER
```

Configurable via environment variables.

---

## Environment Variables

Create a `.env` file in the project root:

```env
# API
API_PORT=4000

# Thresholds (optional — these are the defaults)
VITE_START_THRESHOLD=95
VITE_SUSTAIN_THRESHOLD=85
VITE_DROPOUT_GRACE_PERIOD=200
VITE_UI_UPDATE_INTERVAL=60
VITE_SCORE_MULTIPLIER=1

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sound_clash
DB_USER=postgres
DB_PASSWORD=yourpassword

# Cloudflare R2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_key_id
R2_SECRET_ACCESS_KEY=your_secret
R2_BUCKET_NAME=your_bucket
R2_PUBLIC_URL=https://pub-xxxx.r2.dev

# LED Serial (optional)
SERIAL_PORT=/dev/ttyUSB0
SERIAL_BAUD=115200
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL database
- Modern browser with Microphone and Camera permissions granted

### Install

```bash
npm install
```

### Database

Run the migration to create the `scream_sessions` table:

```bash
psql -U postgres -d sound_clash -f migrate.sql
```

### Run (dev — both servers together)

```bash
npm run start
```

This starts both the Vite dev server and the API/WebSocket server concurrently with colour-coded output.

| Server | URL |
|---|---|
| Frontend (Vite) | http://localhost:3878 |
| API + WebSocket | http://localhost:4000 |

### Run individually

```bash
npm run dev          # Vite only
npm run server:dev   # API only (with watch)
```

### Production build

```bash
npm run prod         # builds frontend then starts API server serving dist/
```

---

## LED Protocol (optional)

If `SERIAL_PORT` is set, the server sends ASCII commands over serial to a connected WeMos/Arduino:

| Command | Meaning |
|---|---|
| `IDLE` | No active session |
| `MONITOR:<team>` | Waiting for scream to start |
| `TRACK:<team>:<dB>` | Scream in progress (15 Hz updates) |
| `COMPLETE:<team>:<maxDb>` | Run finished |

---

*SAIA SUITE 2026*
