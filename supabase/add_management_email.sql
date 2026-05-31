-- ============================================================
-- Add management_email column to contacts table
-- Run in Supabase SQL Editor
-- ============================================================

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS management_email text;
