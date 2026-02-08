-- Add view_count column to issues table
ALTER TABLE issues
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Add view_count column to suggestions table
ALTER TABLE suggestions
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create indexes for faster sorting by view_count
CREATE INDEX IF NOT EXISTS idx_issues_view_count ON issues(view_count);
CREATE INDEX IF NOT EXISTS idx_suggestions_view_count ON suggestions(view_count);

-- Update existing rows to have view_count = 0 if NULL
UPDATE issues SET view_count = 0 WHERE view_count IS NULL;
UPDATE suggestions SET view_count = 0 WHERE view_count IS NULL;
