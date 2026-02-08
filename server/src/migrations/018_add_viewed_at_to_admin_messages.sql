-- Add viewed_at column to admin_messages table if it doesn't exist
ALTER TABLE admin_messages
ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMP WITH TIME ZONE NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_messages_viewed_at ON admin_messages(viewed_at);
