-- Allow admin workflow statuses on suggestions (accepted, in_progress, resolved)
-- Existing constraint only allowed: submitted, under_review, approved, implemented, rejected
ALTER TABLE suggestions DROP CONSTRAINT IF EXISTS suggestions_status_check;
ALTER TABLE suggestions ADD CONSTRAINT suggestions_status_check
  CHECK (status IN (
    'submitted',
    'under_review',
    'approved',
    'implemented',
    'rejected',
    'accepted',
    'in_progress',
    'resolved'
  ));
