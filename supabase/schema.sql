-- ============================================================
-- Wavelength RTS — Database Schema
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query)
-- ============================================================

-- Enable required extensions
create extension if not exists "pg_trgm"; -- for fuzzy name matching (Phase 4)

-- ============================================================
-- User Profiles
-- ============================================================
create table if not exists public.user_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  username    text unique not null,
  plan        text not null default 'free',
  created_at  timestamptz not null default now()
);

-- Only the owner can read/write their own profile
alter table public.user_profiles enable row level security;

create policy "user_profiles: owner can select"
  on public.user_profiles for select
  using (auth.uid() = id);

create policy "user_profiles: owner can insert"
  on public.user_profiles for insert
  with check (auth.uid() = id);

create policy "user_profiles: owner can update"
  on public.user_profiles for update
  using (auth.uid() = id);

-- ============================================================
-- Contacts
-- ============================================================
create table if not exists public.contacts (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references auth.users(id) on delete cascade,

  -- Identity
  artist_band             text not null,
  contact_name            text,
  email                   text,
  genre                   text,
  song_title              text,
  spotify_track_link      text,
  referral_source         text,
  location                text,

  -- Relationship status
  conversation_status     text check (conversation_status in (
    'New',
    'New Reply (Needs Response)',
    'Replied (Waiting on Them)',
    'Ongoing Conversation',
    'Call Scheduled',
    'Had Call',
    'Follow-Up Needed',
    'Inactive'
  )),
  waiting_on              text check (waiting_on in ('Me', 'Them', 'Scheduled', 'None')),
  priority                text check (priority in ('High', 'Medium', 'Low')),
  vibe_fit                text check (vibe_fit in ('Great Fit', 'Good Fit', 'Unsure', 'Not a Fit')),
  project_type            text check (project_type in ('Mixing', 'Mastering', 'Recording', 'Production')),

  -- Dates & interaction
  first_contact_date      date,
  last_contact_date       date,
  last_interaction_type   text check (last_interaction_type in ('Email', 'Call', 'DM', 'In-person')),
  follow_up_in            text check (follow_up_in in (
    'Tomorrow',
    'In 3 days',
    'In 1 week',
    'In 2 weeks',
    'In 3 weeks',
    'In 1 month',
    'In 2 months',
    'In 3 months',
    'In 6 months',
    'When they reach out'
  )),

  -- Call
  had_call                text check (had_call in ('Yes', 'No')),
  call_date               date,

  -- Notes
  research_notes          text,
  relationship_notes      text,

  -- System fields
  is_new                  boolean not null default false,
  email_source            text not null default 'manual'
                            check (email_source in ('manual', 'carl_bcc', 'user_bcc')),
  created_at              timestamptz not null default now()
);

-- Indexes
create index if not exists contacts_user_id_idx     on public.contacts(user_id);
create index if not exists contacts_email_idx       on public.contacts(user_id, email);
create index if not exists contacts_created_at_idx  on public.contacts(user_id, created_at desc);

-- Row-level security: users only see their own contacts
alter table public.contacts enable row level security;

create policy "contacts: owner can select"
  on public.contacts for select
  using (auth.uid() = user_id);

create policy "contacts: owner can insert"
  on public.contacts for insert
  with check (auth.uid() = user_id);

create policy "contacts: owner can update"
  on public.contacts for update
  using (auth.uid() = user_id);

create policy "contacts: owner can delete"
  on public.contacts for delete
  using (auth.uid() = user_id);

-- ============================================================
-- Grant table-level permissions to the authenticated role
-- (RLS policies control row access; grants control table access)
-- ============================================================
grant select, insert, update, delete on public.user_profiles to authenticated;
grant select, insert, update, delete on public.contacts to authenticated;
