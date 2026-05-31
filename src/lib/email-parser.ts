/**
 * Modular email parsing functions for the Wavelength RTS inbound webhook.
 *
 * Each function handles one field or concern. Adding support for Carl's
 * outreach template fields (Phase 5) means adding new functions here
 * without touching the webhook handler logic.
 */

// ── Address parsing ────────────────────────────────────────────────────────

export interface ParsedAddress {
  name: string;
  email: string;
}

/**
 * Parse a single RFC 5322 address string.
 * Handles: "Display Name <email@example.com>", "email@example.com",
 *          '"Display, Name" <email@example.com>'
 */
export function parseEmailAddress(raw: string): ParsedAddress {
  const trimmed = raw.trim();
  const bracketMatch = trimmed.match(/^"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (bracketMatch) {
    return {
      name: bracketMatch[1].trim().replace(/^"|"$/g, ""),
      email: bracketMatch[2].trim().toLowerCase(),
    };
  }
  return { name: "", email: trimmed.toLowerCase() };
}

/**
 * Parse a comma-separated list of addresses, respecting angle brackets
 * so commas inside display names or angle brackets don't split incorrectly.
 */
export function parseAddressList(raw: string): ParsedAddress[] {
  if (!raw?.trim()) return [];
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === "<") depth++;
    else if (raw[i] === ">") depth--;
    else if (raw[i] === "," && depth === 0) {
      parts.push(raw.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(raw.slice(start).trim());
  return parts.filter(Boolean).map(parseEmailAddress);
}

/** True if the address belongs to the Wavelength inbound domain. */
export function isInboundAddress(email: string): boolean {
  return email.toLowerCase().endsWith("@wavelength-rts.com");
}

// ── Forward detection & extraction ────────────────────────────────────────

/**
 * True if the subject line indicates a forwarded message.
 * Matches "Fwd:", "FW:", "Fw:" and variants with or without spaces.
 */
export function isForward(subject: string): boolean {
  return /^\s*fw[d]?\s*:/i.test(subject);
}

/**
 * True if the plain-text body contains a standard forward marker.
 * Handles Gmail, Apple Mail, Outlook, and Yahoo formats.
 */
export function hasForwardMarker(body: string): boolean {
  if (!body) return false;
  return /(-{3,}|—{3,})\s*(forwarded|original)\s+message|begin\s+forwarded\s+message/i.test(body);
}

/**
 * Extract the original sender from a forwarded email body.
 *
 * Handles the most common client formats:
 *   Gmail:      "---------- Forwarded message ---------\nFrom: ..."
 *   Apple Mail: "Begin forwarded message:\n\nFrom: ..."
 *   Outlook:    "-----Original Message-----\nFrom: ..."
 *   Yahoo:      "---- Forwarded Message ----\nFrom: ..."
 *
 * Falls back to the first bare "From: " line in the body if no marker
 * is found (covers edge cases and non-standard clients).
 *
 * Returns null if no valid address can be extracted.
 */
export function extractForwardedSender(body: string): ParsedAddress | null {
  if (!body) return null;

  // Normalise line endings for consistent regex behaviour
  const text = body.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Find the start of the forwarded block so we don't match "From:" in the
  // user's own reply text above the marker.
  const markerPattern =
    /(-{3,}|—{3,})\s*(forwarded|original)\s+message.*?\n|begin\s+forwarded\s+message\s*:\s*\n/i;
  const markerMatch = text.match(markerPattern);
  const searchText =
    markerMatch?.index !== undefined
      ? text.slice(markerMatch.index + markerMatch[0].length)
      : text;

  // Match "From: Name <email>" or "From: email"
  // Allow optional leading ">" for quoted/indented lines
  const fromMatch = searchText.match(/^>?\s*From:\s*(.+)$/im);
  if (!fromMatch) return null;

  const parsed = parseEmailAddress(fromMatch[1].trim());
  // Discard if we couldn't extract a valid-looking email address
  return parsed.email.includes("@") ? parsed : null;
}

// ── Content extraction ─────────────────────────────────────────────────────

/**
 * Extract the first Spotify track URL from an email body.
 * Handles open.spotify.com/track/* with optional query strings.
 */
export function extractSpotifyLink(body: string): string | null {
  if (!body) return null;
  const match = body.match(
    /https?:\/\/open\.spotify\.com\/track\/[A-Za-z0-9]+(?:[?][^\s<"]*)?/
  );
  return match?.[0] ?? null;
}

// ── Fuzzy name matching ────────────────────────────────────────────────────

/**
 * Bigram Jaccard similarity between two strings.
 * Returns 0–1 (1 = identical). Used for Tier 2 fuzzy contact matching.
 *
 * Normalises case, strips punctuation, removes leading "the".
 */
export function nameSimilarity(a: string, b: string): number {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/\bthe\b/gi, "")
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;

  const bigrams = (s: string): Set<string> => {
    const out = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) out.add(s.slice(i, i + 2));
    return out;
  };

  const ba = bigrams(na);
  const bb = bigrams(nb);
  const intersection = [...ba].filter((x) => bb.has(x)).length;
  const union = new Set([...ba, ...bb]).size;
  return union === 0 ? 0 : intersection / union;
}

// ── Carl's template fields (Phase 5) ──────────────────────────────────────
// Add one function per field. Each function receives the plain-text body
// and returns the extracted value or null. The webhook calls them all.

/**
 * Placeholder: extract Song Title from Carl's outreach template.
 * Replace the regex once the template format is confirmed.
 */
export function extractSongTitle(_body: string): string | null {
  // TODO (Phase 5): implement once Carl's template is confirmed
  return null;
}

/**
 * Placeholder: extract Genre from Carl's outreach template.
 */
export function extractGenre(_body: string): string | null {
  // TODO (Phase 5): implement once Carl's template is confirmed
  return null;
}

/**
 * Placeholder: extract Location from Carl's outreach template.
 */
export function extractLocation(_body: string): string | null {
  // TODO (Phase 5): implement once Carl's template is confirmed
  return null;
}

/**
 * Run all Phase 5 template extractors and return their results.
 * Add new extractors here as Carl's template fields are confirmed.
 */
export function extractTemplateFields(body: string) {
  return {
    song_title: extractSongTitle(body),
    genre: extractGenre(body),
    location: extractLocation(body),
  };
}
