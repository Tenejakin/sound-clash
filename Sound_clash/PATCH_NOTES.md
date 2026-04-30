# Patch Notes

---

## Session — 2026-03-03

### Team Selection — Smooth Transition Animation
- Tapping a team button now immediately shows a full-screen connecting state instead of a blank stall
- The team colour overlay pulses to full brightness while `getUserMedia` initialises
- A large team name (italic, team-coloured) is displayed with five bouncing bars and an **INITIALIZING SENSORS** label
- On error the UI resets cleanly back to the team selection screen

### Score System
- Added `VITE_SCORE_MULTIPLIER` to `.env` (currently `100`) — adjust this single value to scale all scores
- Score formula: `maxDb × (durationSeconds) × multiplier`
- `score` field added to the `ScoreEntry` type and persisted to `localStorage`
- Server (`server.ts`) now computes `final_score` using the same formula and stores it in PostgreSQL
- Leaderboard and DB queries now order by `final_score` instead of raw duration

### End Screen — Score as Hero Number
- The large central number that previously showed elapsed time now shows the **final score** when a run completes
- Score animates from **0 → final value** over 2 seconds using an ease-out exponential curve
- Font size scales simultaneously from small → large as the number counts up, giving a dramatic reveal
- A `SCORE` label fades in underneath in sync with the animation
- Below the score: a compact three-column row shows **Peak dB**, **Time**, and **Rank**

### Result Card Image (Canvas)
- Score is now the dominant element — large, team-coloured, centred
- `SCORE` label sits below the number
- Secondary row: **dB PEAK** (left) | **SECONDS** (right) — clearly smaller than the score

### Number Formatting
- Thousands separator changed from `,` to `.` everywhere (e.g. `8.432` instead of `8,432`)
- Applied to the end screen, result card image, and leaderboard

### Strings File
- Created `strings.ts` — a single file containing every user-visible text string in the app
- Both `App.tsx` and `Leaderboard.tsx` now import from `strings.ts`
- Change any label, button text, status message, or canvas watermark in one place without touching component code
