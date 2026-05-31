"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { extractLocalPart, isAppleRelayEmail } from "@/lib/utils";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRelayEmail, setIsRelayEmail] = useState(false);

  useEffect(() => {
    async function prefill() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const email = user.email ?? "";
      setIsRelayEmail(isAppleRelayEmail(email));
      const suggestion = extractLocalPart(email);
      setUsername(suggestion);

      const name =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        "";
      setFullName(name);
    }
    prefill();
  }, [router, supabase]);

  const checkAvailability = useCallback(async (value: string) => {
    if (!value || value.length < 2) { setAvailable(null); return; }
    setChecking(true);
    const { data } = await supabase
      .from("user_profiles")
      .select("username")
      .eq("username", value)
      .maybeSingle();
    setAvailable(!data);
    setChecking(false);
  }, [supabase]);

  useEffect(() => {
    const timeout = setTimeout(() => checkAvailability(username), 400);
    return () => clearTimeout(timeout);
  }, [username, checkAvailability]);

  const sanitizeUsername = (val: string) =>
    val.toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 30);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!available) return;
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { error: upsertError } = await supabase.from("user_profiles").upsert({
      id: user.id,
      email: user.email,
      full_name: fullName || null,
      username,
      plan: "free",
    });

    if (upsertError) {
      if (upsertError.code === "23505") {
        setError("That username is already taken. Please choose another.");
        setAvailable(false);
      } else {
        setError(upsertError.message);
      }
      setLoading(false);
      return;
    }

    router.push("/contacts");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">One last step</h1>
          <p className="text-sm text-gray-500 mt-1">Set up your personal inbound address</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
              <input
                type="text"
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Choose a username</label>

              {isRelayEmail && (
                <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-2">
                  You signed in with a private Apple relay address. Consider choosing a recognizable username.
                </p>
              )}

              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(sanitizeUsername(e.target.value));
                    setAvailable(null);
                  }}
                  placeholder="your-name"
                  minLength={2}
                  maxLength={30}
                  required
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent ${
                    available === false
                      ? "border-red-300 focus:ring-red-400"
                      : available === true
                      ? "border-green-300 focus:ring-green-400"
                      : "border-gray-300 focus:ring-indigo-500"
                  }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                  {checking && <span className="text-gray-400">…</span>}
                  {!checking && available === true && <span className="text-green-600">✓</span>}
                  {!checking && available === false && <span className="text-red-500">✗</span>}
                </div>
              </div>

              {available === false && !checking && (
                <p className="text-xs text-red-600 mt-1">That username is already taken.</p>
              )}

              {/* Live preview */}
              <div className="mt-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500">Your personal inbound address will be:</p>
                <p className="text-sm font-mono text-indigo-700 mt-0.5 break-all">
                  {username || "…"}@wavelength-rts.com
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                BCC this address when replying to artists to automatically log the interaction.
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !available || checking}
              className="w-full py-2.5 px-4 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Setting up…" : "Get started"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
