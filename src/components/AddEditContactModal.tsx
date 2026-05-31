"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Contact } from "@/lib/types";

const CONVERSATION_STATUSES = [
  "New Reply (Needs Response)",
  "Replied (Waiting on Them)",
  "Ongoing Conversation",
  "Call Scheduled",
  "Had Call",
  "Follow-Up Needed",
  "Inactive",
];

const FOLLOW_UP_OPTIONS = [
  "Tomorrow",
  "In 3 days",
  "In 1 week",
  "In 2 weeks",
  "In 3 weeks",
  "In 1 month",
  "In 2 months",
  "In 3 months",
  "In 6 months",
  "When they reach out",
];

interface Props {
  contact?: Contact;
  onClose: () => void;
  onSaved: (contact: Contact) => void;
}

type FormData = Omit<Contact, "id" | "user_id" | "created_at" | "is_new" | "email_source">;

const emptyForm: FormData = {
  artist_band: "",
  contact_name: null,
  email: null,
  genre: null,
  song_title: null,
  spotify_track_link: null,
  referral_source: null,
  location: null,
  conversation_status: null,
  waiting_on: null,
  first_contact_date: null,
  last_contact_date: null,
  last_interaction_type: null,
  follow_up_in: null,
  had_call: null,
  call_date: null,
  project_type: null,
  priority: null,
  vibe_fit: null,
  research_notes: null,
  relationship_notes: null,
};

export default function AddEditContactModal({ contact, onClose, onSaved }: Props) {
  const supabase = createClient();
  const [form, setForm] = useState<FormData>(
    contact
      ? {
          artist_band: contact.artist_band,
          contact_name: contact.contact_name,
          email: contact.email,
          genre: contact.genre,
          song_title: contact.song_title,
          spotify_track_link: contact.spotify_track_link,
          referral_source: contact.referral_source,
          location: contact.location,
          conversation_status: contact.conversation_status,
          waiting_on: contact.waiting_on,
          first_contact_date: contact.first_contact_date,
          last_contact_date: contact.last_contact_date,
          last_interaction_type: contact.last_interaction_type,
          follow_up_in: contact.follow_up_in,
          had_call: contact.had_call,
          call_date: contact.call_date,
          project_type: contact.project_type,
          priority: contact.priority,
          vibe_fit: contact.vibe_fit,
          research_notes: contact.research_notes,
          relationship_notes: contact.relationship_notes,
        }
      : emptyForm
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  function set(field: keyof FormData, value: string | null) {
    setForm((f) => ({ ...f, [field]: value || null }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.artist_band.trim()) { setError("Artist / Band name is required."); return; }
    setSaving(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not authenticated."); setSaving(false); return; }

    if (contact) {
      const { data, error: err } = await supabase
        .from("contacts")
        .update({ ...form })
        .eq("id", contact.id)
        .select()
        .single();
      if (err) { setError(err.message); setSaving(false); return; }
      onSaved(data as Contact);
    } else {
      const { data, error: err } = await supabase
        .from("contacts")
        .insert({ ...form, user_id: user.id, is_new: false, email_source: "manual" })
        .select()
        .single();
      if (err) { setError(err.message); setSaving(false); return; }
      onSaved(data as Contact);
    }
    setSaving(false);
  }

  return (
    <div
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {contact ? "Edit contact" : "Add new contact"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Core identity */}
            <Section title="Identity">
              <Field label="Artist / Band *">
                <input
                  type="text"
                  value={form.artist_band}
                  onChange={(e) => set("artist_band", e.target.value)}
                  placeholder="Artist or band name"
                  required
                  className={INPUT}
                />
              </Field>
              <Field label="Contact Name">
                <input type="text" value={form.contact_name ?? ""} onChange={(e) => set("contact_name", e.target.value)} placeholder="Individual's name" className={INPUT} />
              </Field>
              <Field label="Email">
                <input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} placeholder="contact@example.com" className={INPUT} />
              </Field>
              <Field label="Genre">
                <input type="text" value={form.genre ?? ""} onChange={(e) => set("genre", e.target.value)} placeholder="e.g. Indie R&B" className={INPUT} />
              </Field>
              <Field label="Location">
                <input type="text" value={form.location ?? ""} onChange={(e) => set("location", e.target.value)} placeholder="City / region" className={INPUT} />
              </Field>
            </Section>

            {/* Music / Project */}
            <Section title="Music & Project">
              <Field label="Song Title">
                <input type="text" value={form.song_title ?? ""} onChange={(e) => set("song_title", e.target.value)} placeholder="The track that caught your attention" className={INPUT} />
              </Field>
              <Field label="Spotify Track Link">
                <input type="url" value={form.spotify_track_link ?? ""} onChange={(e) => set("spotify_track_link", e.target.value)} placeholder="https://open.spotify.com/track/…" className={INPUT} />
              </Field>
              <Field label="Project Type">
                <Select value={form.project_type} onChange={(v) => set("project_type", v)} options={["Mixing", "Mastering", "Recording", "Production"]} />
              </Field>
              <Field label="Vibe / Fit">
                <Select value={form.vibe_fit} onChange={(v) => set("vibe_fit", v)} options={["Great Fit", "Good Fit", "Unsure", "Not a Fit"]} />
              </Field>
            </Section>

            {/* Relationship */}
            <Section title="Relationship Status">
              <Field label="Conversation Status">
                <Select value={form.conversation_status} onChange={(v) => set("conversation_status", v)} options={CONVERSATION_STATUSES} />
              </Field>
              <Field label="Priority">
                <Select value={form.priority} onChange={(v) => set("priority", v)} options={["High", "Medium", "Low"]} />
              </Field>
              <Field label="Waiting On">
                <Select value={form.waiting_on} onChange={(v) => set("waiting_on", v)} options={["Me", "Them", "Scheduled", "None"]} />
              </Field>
              <Field label="Referral Source">
                <input type="text" value={form.referral_source ?? ""} onChange={(e) => set("referral_source", e.target.value)} placeholder="How they came into the pipeline" className={INPUT} />
              </Field>
            </Section>

            {/* Dates & Follow-up */}
            <Section title="Dates & Follow-up">
              <Field label="First Contact Date">
                <input type="date" value={form.first_contact_date ?? ""} onChange={(e) => set("first_contact_date", e.target.value)} className={INPUT} />
              </Field>
              <Field label="Last Contact Date">
                <input type="date" value={form.last_contact_date ?? ""} onChange={(e) => set("last_contact_date", e.target.value)} className={INPUT} />
              </Field>
              <Field label="Last Interaction Type">
                <Select value={form.last_interaction_type} onChange={(v) => set("last_interaction_type", v)} options={["Email", "Call", "DM", "In-person"]} />
              </Field>
              <Field label="Follow-Up In">
                <Select value={form.follow_up_in} onChange={(v) => set("follow_up_in", v)} options={FOLLOW_UP_OPTIONS} />
              </Field>
            </Section>

            {/* Call */}
            <Section title="Call">
              <Field label="Had Call">
                <Select value={form.had_call} onChange={(v) => set("had_call", v)} options={["Yes", "No"]} />
              </Field>
              {form.had_call === "Yes" && (
                <Field label="Call Date">
                  <input type="date" value={form.call_date ?? ""} onChange={(e) => set("call_date", e.target.value)} className={INPUT} />
                </Field>
              )}
            </Section>

            {/* Notes */}
            <Section title="Notes">
              <Field label="Research Notes" full>
                <textarea
                  value={form.research_notes ?? ""}
                  onChange={(e) => set("research_notes", e.target.value)}
                  placeholder="What you know about their music before speaking…"
                  rows={3}
                  className={`${INPUT} resize-none`}
                />
              </Field>
              <Field label="Relationship Notes" full>
                <textarea
                  value={form.relationship_notes ?? ""}
                  onChange={(e) => set("relationship_notes", e.target.value)}
                  placeholder="What you learn from actually talking to them…"
                  rows={3}
                  className={`${INPUT} resize-none`}
                />
              </Field>
            </Section>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between gap-3">
            {error && <p className="text-sm text-red-600 flex-1">{error}</p>}
            <div className="flex gap-2 ml-auto">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
                {saving ? "Saving…" : contact ? "Save changes" : "Add contact"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

const INPUT = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  options: string[];
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className={INPUT}
    >
      <option value="">—</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}
