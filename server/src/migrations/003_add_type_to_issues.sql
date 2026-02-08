-- Add type field to issues table to distinguish between issues and suggestions
ALTER TABLE issues 
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'issue' CHECK (type IN ('issue', 'suggestion'));

-- Add index for type
CREATE INDEX IF NOT EXISTS idx_issues_type ON issues(type);

-- Update existing records to be 'issue' type
UPDATE issues SET type = 'issue' WHERE type IS NULL;
