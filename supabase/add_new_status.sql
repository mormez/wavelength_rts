-- ============================================================
-- Add 'New' to the conversation_status check constraint
-- Run in Supabase SQL Editor
-- ============================================================

-- Drop the existing constraint (PostgreSQL auto-names it contacts_conversation_status_check)
ALTER TABLE public.contacts
  DROP CONSTRAINT IF EXISTS contacts_conversation_status_check;

-- Re-add with 'New' included at the top
ALTER TABLE public.contacts
  ADD CONSTRAINT contacts_conversation_status_check
  CHECK (conversation_status IN (
    'New',
    'New Reply (Needs Response)',
    'Replied (Waiting on Them)',
    'Ongoing Conversation',
    'Call Scheduled',
    'Had Call',
    'Follow-Up Needed',
    'Inactive'
  ));
