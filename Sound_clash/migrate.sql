-- Sound Clash: add image_url column to scream_sessions
ALTER TABLE scream_sessions
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Sound Clash: add nickname column to scream_sessions
ALTER TABLE scream_sessions
  ADD COLUMN IF NOT EXISTS nickname TEXT;
