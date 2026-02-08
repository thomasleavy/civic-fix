-- Add admin note columns to issues table
ALTER TABLE issues 
ADD COLUMN IF NOT EXISTS admin_note TEXT,
ADD COLUMN IF NOT EXISTS admin_action_by UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS admin_action_at TIMESTAMP WITH TIME ZONE;

-- Add admin note columns to suggestions table
ALTER TABLE suggestions 
ADD COLUMN IF NOT EXISTS admin_note TEXT,
ADD COLUMN IF NOT EXISTS admin_action_by UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS admin_action_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_issues_admin_action_by ON issues(admin_action_by);
CREATE INDEX IF NOT EXISTS idx_suggestions_admin_action_by ON suggestions(admin_action_by);
CREATE INDEX IF NOT EXISTS idx_issues_admin_action_at ON issues(admin_action_at);
CREATE INDEX IF NOT EXISTS idx_suggestions_admin_action_at ON suggestions(admin_action_at);
