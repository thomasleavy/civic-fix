-- Add theme preference column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS theme_preference VARCHAR(10) DEFAULT 'light' CHECK (theme_preference IN ('light', 'dark'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_theme_preference ON users(theme_preference);
