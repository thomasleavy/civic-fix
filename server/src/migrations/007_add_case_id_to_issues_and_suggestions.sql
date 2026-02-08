-- Add case_id column to issues table
ALTER TABLE issues ADD COLUMN IF NOT EXISTS case_id VARCHAR(20) UNIQUE;

-- Add case_id column to suggestions table
ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS case_id VARCHAR(20) UNIQUE;

-- Create index for faster lookups by case_id
CREATE INDEX IF NOT EXISTS idx_issues_case_id ON issues(case_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_case_id ON suggestions(case_id);

-- Generate case IDs for existing issues (format: CIVIC-XXXX-XXXX)
-- Using MD5 hash of id + timestamp to ensure uniqueness
UPDATE issues 
SET case_id = 'CIVIC-' || 
    UPPER(SUBSTRING(MD5(id::TEXT || created_at::TEXT || RANDOM()::TEXT) FROM 1 FOR 4)) || '-' || 
    UPPER(SUBSTRING(MD5(id::TEXT || created_at::TEXT || RANDOM()::TEXT) FROM 5 FOR 4))
WHERE case_id IS NULL;

-- Generate case IDs for existing suggestions
UPDATE suggestions 
SET case_id = 'CIVIC-' || 
    UPPER(SUBSTRING(MD5(id::TEXT || created_at::TEXT || RANDOM()::TEXT) FROM 1 FOR 4)) || '-' || 
    UPPER(SUBSTRING(MD5(id::TEXT || created_at::TEXT || RANDOM()::TEXT) FROM 5 FOR 4))
WHERE case_id IS NULL;

-- Make case_id NOT NULL after populating existing records
ALTER TABLE issues ALTER COLUMN case_id SET NOT NULL;
ALTER TABLE suggestions ALTER COLUMN case_id SET NOT NULL;
