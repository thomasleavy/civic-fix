-- Make latitude and longitude optional for issues
-- Note: PostgreSQL requires separate ALTER statements
ALTER TABLE issues ALTER COLUMN latitude DROP NOT NULL;
ALTER TABLE issues ALTER COLUMN longitude DROP NOT NULL;
