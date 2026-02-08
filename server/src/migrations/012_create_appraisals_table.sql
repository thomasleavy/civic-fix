-- Create appraisals table to track likes/thumbs up for issues and suggestions
CREATE TABLE IF NOT EXISTS appraisals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
    suggestion_id UUID REFERENCES suggestions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Ensure a user can only like an issue OR suggestion, not both
    CONSTRAINT check_one_target CHECK (
        (issue_id IS NOT NULL AND suggestion_id IS NULL) OR
        (issue_id IS NULL AND suggestion_id IS NOT NULL)
    ),
    -- Ensure a user can only like each item once
    CONSTRAINT unique_issue_appraisal UNIQUE (user_id, issue_id),
    CONSTRAINT unique_suggestion_appraisal UNIQUE (user_id, suggestion_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_appraisals_issue_id ON appraisals(issue_id);
CREATE INDEX IF NOT EXISTS idx_appraisals_suggestion_id ON appraisals(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_appraisals_user_id ON appraisals(user_id);

-- Add comment for clarity
COMMENT ON TABLE appraisals IS 'Tracks user likes/appraisals for public issues and suggestions';
