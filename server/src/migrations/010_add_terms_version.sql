-- Add terms version tracking
-- This allows us to track which version of terms the user accepted
-- If terms are updated, we can require users to accept the new version

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS terms_version INTEGER DEFAULT 1;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_terms_version ON users(terms_version);

-- Set current version for existing users who have accepted terms
UPDATE users SET terms_version = 1 WHERE terms_accepted = TRUE AND terms_version IS NULL;

-- Set version 0 for users who haven't accepted (so they'll be prompted)
UPDATE users SET terms_version = 0 WHERE terms_accepted = FALSE;
