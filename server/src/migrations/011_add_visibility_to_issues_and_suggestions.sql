-- Add visibility column to issues table
ALTER TABLE issues 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- Add visibility column to suggestions table
ALTER TABLE suggestions 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- Create indexes for faster lookups of public issues/suggestions by county
CREATE INDEX IF NOT EXISTS idx_issues_is_public_county ON issues(is_public, county) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_suggestions_is_public_county ON suggestions(is_public, county) WHERE is_public = TRUE;

-- Set existing issues/suggestions to private by default
UPDATE issues SET is_public = FALSE WHERE is_public IS NULL;
UPDATE suggestions SET is_public = FALSE WHERE is_public IS NULL;
