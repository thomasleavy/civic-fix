-- Add ban-related columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS banned_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ban_reason TEXT,
ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries on banned users
CREATE INDEX IF NOT EXISTS idx_users_banned ON users(banned);
CREATE INDEX IF NOT EXISTS idx_users_banned_until ON users(banned_until);

-- Add check constraint to ensure banned_until is in the future if banned is true
-- (This will be handled in application logic, but we can add a comment)
COMMENT ON COLUMN users.banned IS 'Whether the user is currently banned';
COMMENT ON COLUMN users.banned_until IS 'Timestamp when the ban expires (NULL for permanent bans)';
COMMENT ON COLUMN users.ban_reason IS 'Reason for the ban';
COMMENT ON COLUMN users.banned_by IS 'ID of the admin who issued the ban';
