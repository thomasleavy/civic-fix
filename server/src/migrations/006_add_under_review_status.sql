-- Add 'under_review' (and allow 'accepted'/'rejected' so re-runs don't fail if 021 was applied)
ALTER TABLE issues DROP CONSTRAINT IF EXISTS issues_status_check;
ALTER TABLE issues ADD CONSTRAINT issues_status_check
  CHECK (status IN ('reported', 'under_review', 'accepted', 'rejected', 'in_progress', 'resolved', 'closed'));

-- Update existing 'reported' status to 'under_review' for consistency
UPDATE issues SET status = 'under_review' WHERE status = 'reported';
