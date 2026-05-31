# Wavelength RTS — Claude Code Project Brief

## What This App Is

Wavelength RTS is a SaaS web application for audio engineers and other creative professionals. It is a **Relationship Tracking System (RTS)** — the counterpart to a CRM, but built for long-term collaboration rather than sales. Users track artists and bands they are building relationships with, not leads they are trying to close.

The creator is an active audio engineer using the app himself. Every field, dropdown, and default reflects real professional experience.

---

## Live App

- **Production URL:** https://wavelength-rts.com
- **Railway URL:** https://wavelengthrts-production.up.railway.app
- **Inbound email format:** username@wavelength-rts.com (e.g. mormez@wavelength-rts.com)

---

## Tech Stack

| Layer | Tool | Notes |
|---|---|---|
| Frontend | Next.js (App Router) | Hosted on Railway |
| Database + Auth | Supabase | Row-level security on all tables |
| Hosting | Railway | Auto-deploys on GitHub push |
| Email Parsing | SendGrid Inbound Parse | Webhook at /api/inbound-email |
| Domain | wavelength-rts.com | DNS managed in Namecheap |

---

## External Services — Credentials Location

- **Supabase:** Project URL and keys in `.env.local` and Railway Variables
- **SendGrid:** No API key needed — Inbound Parse is receive-only and requires no key. A SendGrid API key would only be needed if the app starts *sending* emails (not in scope yet).
- **Google OAuth:** Client ID and Secret configured in Supabase Auth → Sign In / Providers → Google
- **Railway:** Environment variables in Railway → wavelength_rts → Variables tab

---

## Database Schema

Two main tables:

**user_profiles**
- id (UUID, matches Supabase Auth user ID)
- email
- full_name
- username (unique, becomes inbound address: username@wavelength-rts.com)
- plan (default: 'free')
- created_at

**contacts**
- All relationship tracking fields (artist, email, genre, spotify link, status, dates, notes, etc.)
- is_new (boolean — drives NEW badge, cleared on login)
- email_source ('manual', 'carl_bcc', or 'user_bcc')
- created_at
- user_id (foreign key to authenticated user, enforced by RLS)

**pending_matches**
- Holds Tier 2 fuzzy email matches requiring user confirmation before merging

Calculated fields (never stored in DB, computed on frontend):
- Follow-Up Date (Last Contact Date + Follow-Up In offset)
- Days Until Follow-Up (Follow-Up Date minus today)
- Days Since Last Touchpoint (today minus Last Contact Date)

---

## Authentication

- Supabase Auth with Google Sign-In and email/password
- Apple Sign-In to be added later (requires Apple Developer account — not yet set up)
- Row-level security on all tables — users can only access their own data
- On signup: generate username (pre-filled from sign-in email), create user_profiles row, set inbound address
- On login: set is_new = false for all user's contacts (clears NEW badges)

---

## Email Automation (Phase 4)

SendGrid Inbound Parse webhook at `/api/inbound-email`

Two scenarios:
1. **Carl's BCC** — Carl loops user in and BCCs the app. Creates new contact with status 'New Reply (Needs Response)'
2. **User's BCC** — User replies to artist and BCCs the app. Updates existing contact or creates new one with status 'Replied (Waiting on Them)'

Contact matching tiers:
- Tier 1: Exact email match → auto-update
- Tier 2: Fuzzy name match → flag for user confirmation (stored in pending_matches)
- Tier 3: No match → create new contact

Parse from every inbound email:
- Artist email address
- Artist name
- Spotify track URL (regex: open.spotify.com/track/*)
- Carl's template fields (to be added as modular extraction functions in `src/lib/email-parser.ts`)

---

## Build Phases

- ✅ Phase 1: Working app — contact list, add/edit contact, auth
- ✅ Phase 2: Artist Detail view — full single-contact screen, inline editing
- ⏳ Phase 3: Account Settings screen — dedicated `/settings` page with user's name, email, plan, and inbound address copy button (inbound address is currently shown in the contact list banner and user menu, but no dedicated settings page exists yet)
- ✅ Phase 4: Email automation — SendGrid webhook, contact matching, email parsing
- ⏳ Phase 5: Carl's template parsing — extend email parser once template is confirmed
- ⏳ Phase 6: Filters & polish — pre-built filter views, dashboard, mobile responsiveness

---

## UI Architecture

### Contact List + Side Panel
Clicking a contact row opens an **inline detail panel** on the right side of the screen. All fields are visible and editable inline inside the panel — no navigation required. The full-page Artist Detail view (`/contacts/[id]`) is accessible via the **"Open Artist Detail View"** button inside the panel header. Do not change click behaviour on list rows without understanding this panel architecture.

### Shared Field Components
Inline-editable field components (InlineText, InlineDate, InlineSelect, ReadOnlyRow, NoteField, Section) are defined in `src/components/ContactFields.tsx` and shared between the side panel (`ContactDetailPanel.tsx`) and the full-page view (`ArtistDetailClient.tsx`). Changes to field behaviour should be made in ContactFields.tsx.

---

## Developer Rules

### Auto-Deploy
Railway auto-deploys on every GitHub push. UI changes, UX improvements, frontend logic, and bug fixes that don't touch the database or auth routes require NO manual steps. Just push and Railway handles it.

### ACTION REQUIRED Rule
**This is mandatory.** If any change we make requires an update to an external service, you MUST flag it explicitly before ending the session using this exact format:

```
ACTION REQUIRED: You need to update [service] by doing [specific steps]
```

Never assume the developer will remember. Always flag it.

### When External Updates Are Needed

| Trigger | Service | Action |
|---|---|---|
| New database table or schema change | Supabase SQL Editor | Run the new .sql file |
| New environment variable or API key | Railway Variables | Add via Raw Editor |
| New auth callback route | Supabase + Google Cloud | Add to Redirect URLs and Authorized Redirect URIs |
| New subdomain | Namecheap Advanced DNS | Add CNAME or A record |
| New third-party service | Railway Variables | Add API key |
| Webhook URL changes | SendGrid Inbound Parse | Update Destination URL |
| Domain or hosting changes | Namecheap + Railway + Supabase + Google | Update all four services |

### What NEVER Needs External Updates
- UI changes (colors, layouts, fonts, components)
- UX improvements (flow, navigation, new screens)
- Frontend logic (calculations, filters, sorting)
- Bug fixes not touching schema or auth routes
- New frontend pages without auth callbacks

---

## Developer Preferences

- Always flag external service updates before ending a session
- Keep the UI clean and modern — nothing that looks like a spreadsheet
- Calculated fields (Follow-Up Date, Days Until Follow-Up, Days Since Last Touchpoint) are always computed on the frontend, never stored in the database
- New contacts always sort to the top by default (created_at descending)
- The NEW badge on contacts is driven by the is_new field — set to true on email-created/updated contacts, cleared to false on user login
- `Waiting On` auto-derives from `Conversation Status` when status changes (mapping defined in `src/lib/types.ts` as `STATUS_TO_WAITING_ON`). The user can override it manually — the auto-derive only fires on status change, not on manual edits to the Waiting On field directly
- Build email parser functions as modular, one-function-per-field in `src/lib/email-parser.ts` so Carl's template fields can be added without rewriting core logic
- When in doubt about whether a change needs an external update, ask explicitly before proceeding
- Apple Sign-In is deferred — do not implement it until explicitly requested

---

## Reference Documents

- Full product spec: Wavelength_RTS_Product_Brief_v2.0.docx
- Services reference: Wavelength_RTS_Services_Reference.docx
