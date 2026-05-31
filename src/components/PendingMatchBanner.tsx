"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface PendingMatch {
  id: string;
  artist_name: string | null;
  artist_email: string | null;
  spotify_track_link: string | null;
  email_source: string;
  raw_subject: string | null;
  candidate_contact_id: string | null;
  candidate_contact_name: string | null;
  template_fields: Record<string, string | null> | null;
  created_at: string;
}

interface Props {
  initialMatches: PendingMatch[];
}

export default function PendingMatchBanner({ initialMatches }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [matches, setMatches] = useState<PendingMatch[]>(initialMatches);
  const [loading, setLoading] = useState(false);

  if (matches.length === 0) return null;

  const match = matches[0];
  const artistLabel = match.artist_name || match.artist_email || "Unknown artist";
  const today = new Date().toISOString().split("T")[0];

  function dismiss(id: string) {
    setMatches((prev) => prev.filter((m) => m.id !== id));
  }

  async function handleMerge() {
    if (!match.candidate_contact_id) return;
    setLoading(true);

    const updates: Record<string, unknown> = {
      is_new: true,
      email_source: match.email_source,
      last_contact_date: today,
      last_interaction_type: "Email",
    };
    if (match.artist_email) updates.email = match.artist_email;
    if (match.spotify_track_link) updates.spotify_track_link = match.spotify_track_link;

    // Apply any Phase 5 template fields
    if (match.template_fields) {
      for (const [key, val] of Object.entries(match.template_fields)) {
        if (val) updates[key] = val;
      }
    }

    if (match.email_source === "user_bcc") {
      updates.conversation_status = "Replied (Waiting on Them)";
      updates.waiting_on = "Them";
    }

    await supabase
      .from("contacts")
      .update(updates)
      .eq("id", match.candidate_contact_id);

    await supabase.from("pending_matches").delete().eq("id", match.id);
    dismiss(match.id);
    router.refresh();
    setLoading(false);
  }

  async function handleCreateNew() {
    setLoading(true);

    const artistBand =
      match.artist_name ||
      match.artist_email?.split("@")[0].replace(/[._-]/g, " ") ||
      "Unknown Artist";

    const newContact: Record<string, unknown> = {
      artist_band: artistBand,
      email: match.artist_email,
      first_contact_date: today,
      last_contact_date: today,
      last_interaction_type: "Email",
      is_new: true,
      email_source: match.email_source,
      conversation_status:
        match.email_source === "user_bcc"
          ? "Replied (Waiting on Them)"
          : "New Reply (Needs Response)",
      waiting_on: match.email_source === "user_bcc" ? "Them" : "Me",
    };
    if (match.spotify_track_link) newContact.spotify_track_link = match.spotify_track_link;
    if (match.template_fields) {
      for (const [key, val] of Object.entries(match.template_fields)) {
        if (val) newContact[key] = val;
      }
    }

    await supabase.from("contacts").insert(newContact);
    await supabase.from("pending_matches").delete().eq("id", match.id);
    dismiss(match.id);
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="mb-5 space-y-3">
      {/* Counter badge if multiple */}
      {matches.length > 1 && (
        <p className="text-xs text-amber-700 font-medium">
          {matches.length} emails need your attention — resolving one at a time
        </p>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mt-0.5">
            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-900 mb-0.5">Possible match found</p>
            <p className="text-sm text-amber-800">
              An email arrived from{" "}
              <span className="font-medium">{artistLabel}</span>
              {match.raw_subject && (
                <span className="text-amber-700"> — {match.raw_subject}</span>
              )}
              . Is this the same person as{" "}
              <span className="font-semibold">{match.candidate_contact_name}</span>?
            </p>

            {/* Parsed details */}
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-amber-700">
              {match.artist_email && (
                <span>📧 {match.artist_email}</span>
              )}
              {match.spotify_track_link && (
                <a
                  href={match.spotify_track_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline"
                >
                  🎵 Spotify link
                </a>
              )}
              <span className="capitalize">
                via {match.email_source === "carl_bcc" ? "Carl's BCC" : "your BCC"}
              </span>
            </div>

            {/* Action buttons */}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={handleMerge}
                disabled={loading || !match.candidate_contact_id}
                className="px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                Yes — same person, update {match.candidate_contact_name}
              </button>
              <button
                onClick={handleCreateNew}
                disabled={loading}
                className="px-3 py-1.5 bg-white border border-amber-300 text-amber-800 text-xs font-medium rounded-lg hover:bg-amber-50 transition-colors disabled:opacity-50"
              >
                No — create new contact
              </button>
              <button
                onClick={() => {
                  supabase.from("pending_matches").delete().eq("id", match.id);
                  dismiss(match.id);
                }}
                className="px-3 py-1.5 text-amber-600 text-xs font-medium rounded-lg hover:bg-amber-100 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
