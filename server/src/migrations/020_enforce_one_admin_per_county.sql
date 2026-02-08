-- Add unique constraint on county to ensure only one admin per county
-- First, we need to handle any existing duplicates by keeping only one admin per county
-- (keeping the one with the earliest created_at)

-- Delete duplicate county assignments, keeping the oldest one
-- Use a subquery with DISTINCT ON to get the first record per county ordered by created_at
DELETE FROM admin_locations al1
WHERE al1.id NOT IN (
  SELECT DISTINCT ON (al2.county) al2.id
  FROM admin_locations al2
  ORDER BY al2.county, al2.created_at ASC
);

-- Now add the unique constraint (drop first if exists)
ALTER TABLE admin_locations
DROP CONSTRAINT IF EXISTS admin_locations_county_unique;

ALTER TABLE admin_locations
ADD CONSTRAINT admin_locations_county_unique UNIQUE (county);

-- Create index for faster lookups (if not already exists)
CREATE INDEX IF NOT EXISTS idx_admin_locations_county_unique ON admin_locations(county);
