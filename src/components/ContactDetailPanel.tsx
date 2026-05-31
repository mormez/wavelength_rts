"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Contact,
  ConversationStatus,
  STATUS_BADGE_COLORS,
  STATUS_TO_WAITING_ON,
  FOLLOW_UP_IN_OFFSETS,
  FollowUpIn,
} from "@/lib/types";
import { computeCalculatedFields, daysUntilBgColor, formatDate } from "@/lib/utils";
import { Section, InlineText, InlineDate, InlineSelect, ReadOnlyRow, NoteField } from "./ContactFields";

const CONVERSATION_STATUSES = [
  "New",
  "New Reply (Needs Response)",
  "Replied (Waiting on Them)",
  "Ongoing Conversation",
  "Call Scheduled",
  "Had Call",
  "Follow-Up Needed",
  "Inactive",
];
const FOLLOW_UP_OPTIONS = Object.keys(FOLLOW_UP_IN_OFFSETS) as FollowUpIn[];

interface Props {
  contact: Contact;
  onClose: () => void;
  onUpdated: (contact: Contact) => void;
}

export default function ContactDetailPanel({ contact: initial, onClose, onUpdated }: Props) {
  const supabase = createClient();
  const [contact, setContact] = useState<Contact>(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setContact(initial); }, [initial]);

  const save = useCallback(
    async (updates: Partial<Contact>) => {
      setSaving(true);
      const { data, error } = await supabase
        .from("contacts")
        .update(updates)
        .eq("id", contact.id)
        .select()
        .single();
      if (!error && data) {
        const updated = data as Contact;
        setContact(updated);
        onUpdated(updated);
      }
      setSaving(false);
    },
    [contact.id, supabase, onUpdated]
  );

  const computed = computeCalculatedFields(contact);
  const statusBadge = contact.conversation_status
    ? STATUS_BADGE_COLORS[contact.conversation_status]
    : "bg-gray-100 text-gray-500";

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* Panel header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="font-semibold text-gray-900 truncate">{contact.artist_band}</h2>
          {contact.is_new && (
            <span className="shrink-0 text-xs font-semibold bg-emerald-500 text-white rounded-full px-1.5 py-0.5">NEW</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {saving && <span className="text-xs text-gray-400">Saving…</span>}
          <Link
            href={`/contacts/${contact.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open Artist Detail View
          </Link>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 transition-colors rounded">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Status pills */}
      <div className="flex flex-wrap gap-1.5 px-5 py-2.5 border-b border-gray-100 shrink-0">
        {contact.conversation_status && (
          <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${statusBadge}`}>
            {contact.conversation_status}
          </span>
        )}
        {contact.priority && (
          <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${
            contact.priority === "High" ? "bg-red-100 text-red-700" :
            contact.priority === "Medium" ? "bg-amber-100 text-amber-700" :
            "bg-green-100 text-green-700"
          }`}>
            {contact.priority} priority
          </span>
        )}
        {computed.days_until_follow_up !== null && (
          <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${daysUntilBgColor(computed.days_until_follow_up)}`}>
            {computed.days_until_follow_up <= 0
              ? "Follow-up overdue"
              : `Follow-up in ${computed.days_until_follow_up}d`}
          </span>
        )}
      </div>

      {/* Scrollable fields */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

        <Section title="Identity">
          <InlineText label="Artist / Band" value={contact.artist_band} onSave={(v) => save({ artist_band: v || contact.artist_band })} />
          <InlineText label="Contact Name" value={contact.contact_name} placeholder="Individual's name" onSave={(v) => save({ contact_name: v || null })} />
          <InlineText label="Email" value={contact.email} placeholder="contact@example.com" onSave={(v) => save({ email: v || null })} />
          <InlineText label="Management Email" value={contact.management_email} placeholder="manager@example.com" onSave={(v) => save({ management_email: v || null })} />
          <InlineText label="Genre" value={contact.genre} placeholder="e.g. Indie R&B" onSave={(v) => save({ genre: v || null })} />
          <InlineText label="Location" value={contact.location} placeholder="City / region" onSave={(v) => save({ location: v || null })} />
          <InlineText label="Referral Source" value={contact.referral_source} placeholder="How they came in" onSave={(v) => save({ referral_source: v || null })} />
        </Section>

        <Section title="Music & Project">
          <InlineText label="Song Title" value={contact.song_title} placeholder="The track that caught your attention" onSave={(v) => save({ song_title: v || null })} />
          <InlineText label="Spotify Link" value={contact.spotify_track_link} placeholder="https://open.spotify.com/track/…" onSave={(v) => save({ spotify_track_link: v || null })} isLink />
          <InlineSelect label="Project Type" value={contact.project_type} options={["Mixing", "Mastering", "Recording", "Production"]} onChange={(v) => save({ project_type: v as Contact["project_type"] })} />
          <InlineSelect label="Vibe / Fit" value={contact.vibe_fit} options={["Great Fit", "Good Fit", "Unsure", "Not a Fit"]} onChange={(v) => save({ vibe_fit: v as Contact["vibe_fit"] })} />
        </Section>

        <Section title="Relationship Status">
          <InlineSelect label="Conversation Status" value={contact.conversation_status} options={CONVERSATION_STATUSES} onChange={(v) => {
            const status = v as ConversationStatus | null;
            save({
              conversation_status: status,
              waiting_on: status ? STATUS_TO_WAITING_ON[status] : null,
            });
          }} />
          <InlineSelect label="Waiting On" value={contact.waiting_on} options={["Me", "Them", "Scheduled", "None"]} onChange={(v) => save({ waiting_on: v as Contact["waiting_on"] })} />
          <InlineSelect label="Priority" value={contact.priority} options={["High", "Medium", "Low"]} onChange={(v) => save({ priority: v as Contact["priority"] })} />
        </Section>

        <Section title="Dates & Follow-up">
          <InlineDate label="First Contact" value={contact.first_contact_date} onSave={(v) => save({ first_contact_date: v || null })} />
          <InlineDate label="Last Contact" value={contact.last_contact_date} onSave={(v) => save({ last_contact_date: v || null })} />
          <InlineSelect label="Last Interaction" value={contact.last_interaction_type} options={["Email", "Call", "DM", "In-person"]} onChange={(v) => save({ last_interaction_type: v as Contact["last_interaction_type"] })} />
          <InlineSelect label="Follow-Up In" value={contact.follow_up_in} options={FOLLOW_UP_OPTIONS} onChange={(v) => save({ follow_up_in: v as Contact["follow_up_in"] })} />
          <ReadOnlyRow label="Follow-Up Date" value={computed.follow_up_date ? formatDate(computed.follow_up_date.toISOString()) : null} />
          <ReadOnlyRow
            label="Days Until Follow-Up"
            value={computed.days_until_follow_up !== null ? `${computed.days_until_follow_up}d` : null}
            badge={computed.days_until_follow_up !== null ? daysUntilBgColor(computed.days_until_follow_up) : undefined}
          />
          <ReadOnlyRow
            label="Days Since Last Touchpoint"
            value={computed.days_since_last_touchpoint !== null ? `${computed.days_since_last_touchpoint}d` : null}
          />
        </Section>

        <Section title="Call">
          <InlineSelect label="Had Call" value={contact.had_call} options={["Yes", "No"]} onChange={(v) => save({ had_call: v as Contact["had_call"] })} />
          {contact.had_call === "Yes" && (
            <InlineDate label="Call Date" value={contact.call_date} onSave={(v) => save({ call_date: v || null })} />
          )}
        </Section>

        <Section title="Notes">
          <NoteField
            label="Research Notes"
            value={contact.research_notes}
            placeholder="What you know about their music before speaking…"
            onBlur={(v) => save({ research_notes: v || null })}
          />
          <NoteField
            label="Relationship Notes"
            value={contact.relationship_notes}
            placeholder="What you learn from actually talking to them…"
            onBlur={(v) => save({ relationship_notes: v || null })}
          />
        </Section>

      </div>
    </div>
  );
}

