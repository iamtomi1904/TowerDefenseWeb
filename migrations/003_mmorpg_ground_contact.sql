ALTER TABLE mmorpg_characters
  ADD COLUMN surface_id TEXT NOT NULL DEFAULT 'ground',
  ADD COLUMN position_z DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (position_z BETWEEN -10000 AND 10000),
  ADD COLUMN terrain_revision INTEGER NOT NULL DEFAULT 0 CHECK (terrain_revision >= 0);
