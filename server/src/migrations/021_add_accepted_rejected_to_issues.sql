-- Add 'accepted' and 'rejected' statuses to issues table
ALTER TABLE issues DROP CONSTRAINT IF EXISTS issues_status_check;
ALTER TABLE issues ADD CONSTRAINT issues_status_check 
  CHECK (status IN ('reported', 'under_review', 'accepted', 'rejected', 'in_progress', 'resolved', 'closed'));
