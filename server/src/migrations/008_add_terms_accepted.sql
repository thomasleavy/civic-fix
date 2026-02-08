-- Add terms acceptance tracking to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_terms_accepted ON users(terms_accepted);

-- Update existing users to have terms_accepted = false (they'll need to accept on next login)
UPDATE users SET terms_accepted = FALSE WHERE terms_accepted IS NULL;
