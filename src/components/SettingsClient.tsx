"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Props {
  email: string;
  fullName: string;
  username: string;
  plan: string;
}

export default function SettingsClient({ email, fullName, username, plan }: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [name, setName] = useState(fullName);
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const inboundAddress = `${username}@wavelength-rts.com`;

  async function handleNameSave() {
    if (name === fullName) { setEditingName(false); return; }
    setSavingName(true);
    await supabase
      .from("user_profiles")
      .update({ full_name: name || null })
      .eq("username", username);
    setSavingName(false);
    setEditingName(false);
    router.refresh(); // re-fetches server data so AppShell nav updates
  }

  function handleCopy() {
    navigator.clipboard.writeText(inboundAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const planColors: Record<string, string> = {
    free: "bg-gray-100 text-gray-700",
    pro: "bg-indigo-100 text-indigo-700",
    team: "bg-violet-100 text-violet-700",
  };

  return (
    <div className="max-w-2xl">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/contacts")}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your account and inbound email address</p>
        </div>
      </div>

      <div className="space-y-5">

        {/* ── Profile ─────────────────────────────────────────────────── */}
        <Card title="Profile">
          {/* Full name */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <span className="text-sm text-gray-500 shrink-0 w-28">Full name</span>
            {editingName ? (
              <div className="flex items-center gap-2 flex-1 justify-end">
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleNameSave();
                    if (e.key === "Escape") { setName(fullName); setEditingName(false); }
                  }}
                  className="text-sm border border-indigo-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48"
                />
                <button
                  onClick={handleNameSave}
                  disabled={savingName}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                >
                  {savingName ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={() => { setName(fullName); setEditingName(false); }}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingName(true)}
                className="flex items-center gap-2 group"
              >
                <span className={`text-sm ${name ? "text-gray-900" : "text-gray-400"}`}>
                  {name || "Not set"}
                </span>
                <svg className="w-3 h-3 text-gray-300 group-hover:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
          </div>

          {/* Email */}
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-gray-500 shrink-0 w-28">Login email</span>
            <span className="text-sm text-gray-900">{email}</span>
          </div>
        </Card>

        {/* ── Inbound Address ──────────────────────────────────────────── */}
        <Card title="Inbound Email Address">
          <div className="py-3 space-y-3">
            {/* Address + copy button */}
            <div className="flex items-center justify-between gap-4 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
              <span className="text-sm font-mono text-indigo-900 truncate">{inboundAddress}</span>
              <button
                onClick={handleCopy}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-medium text-indigo-700 hover:bg-indigo-50 transition-colors"
              >
                {copied ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>

            {/* How-to explanation */}
            <div className="space-y-1.5">
              <p className="text-sm text-gray-600">
                BCC this address when replying to an artist, or forward an artist&apos;s email to it, to automatically log the interaction in Wavelength RTS.
              </p>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
              >
                <span>More details</span>
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${showDetails ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showDetails && (
                <ul className="text-xs text-gray-500 space-y-1.5 pl-1 pt-1">
                  <li className="flex items-start gap-1.5">
                    <span className="text-indigo-400 mt-0.5">•</span>
                    <span><strong>StudioLand &quot;New Calendar Link Requested&quot;:</strong> Forward this email — a new contact is created with status &quot;New&quot;, with artist name, email, and management email filled in automatically.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-indigo-400 mt-0.5">•</span>
                    <span><strong>Carl loops you in:</strong> Carl BCCs this address, or you forward his email — a new contact is created with status &quot;New Reply (Needs Response)&quot;.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-indigo-400 mt-0.5">•</span>
                    <span><strong>Your outgoing reply:</strong> BCC this address when replying — the contact&apos;s last interaction date updates and status is set to &quot;Replied (Waiting on Them)&quot;.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-indigo-400 mt-0.5">•</span>
                    <span><strong>Incoming artist email:</strong> Forward any email from an artist — logged as an incoming touchpoint without flipping the status to &quot;Replied&quot;.</span>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </Card>

        {/* ── Subscription ─────────────────────────────────────────────── */}
        <Card title="Subscription">
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-gray-500">Current plan</span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${planColors[plan] ?? "bg-gray-100 text-gray-700"}`}>
              {plan}
            </span>
          </div>
          {plan === "free" && (
            <p className="text-xs text-gray-400 pb-2">
              Billing is not yet active. Pro and Team plans coming soon.
            </p>
          )}
        </Card>

      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{title}</h2>
      {children}
    </div>
  );
}
