-- ============================================================
-- Wavelength RTS — Pending Matches Table
-- Run this in the Supabase SQL Editor after schema.sql
-- ============================================================

create table if not exists public.pending_matches (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references auth.users(id) on delete cascade,

  -- Data parsed from the inbound email
  artist_name             text,
  artist_email            text,
  spotify_track_link      text,
  email_source            text not null check (email_source in ('carl_bcc', 'user_bcc')),
  raw_subject             text,

  -- The fuzzy-matched existing contact (Tier 2)
  candidate_contact_id    uuid references public.contacts(id) on delete set null,
  candidate_contact_name  text,   -- cached so the banner shows even if contact is deleted

  -- Phase 5 template fields — stored as JSON so they can be applied on resolution
  template_fields         jsonb default '{}'::jsonb,

  status                  text not null default 'pending'
                            check (status in ('pending', 'merged', 'created_new')),
  created_at              timestamptz not null default now()
);

create index if not exists pending_matches_user_id_idx
  on public.pending_matches(user_id, status, created_at);

alter table public.pending_matches enable row level security;

-- Authenticated users can read, update, and delete their own pending matches.
-- Inserts come only from the webhook (service role, bypasses RLS).
create policy "pending_matches: owner can select"
  on public.pending_matches for select
  using (auth.uid() = user_id);

create policy "pending_matches: owner can update"
  on public.pending_matches for update
  using (auth.uid() = user_id);

create policy "pending_matches: owner can delete"
  on public.pending_matches for delete
  using (auth.uid() = user_id);

grant select, update, delete on public.pending_matches to authenticated;
