import { createAdminClient } from "@/lib/supabase/admin";
import {
  parseEmailAddress,
  parseAddressList,
  isInboundAddress,
  isForward,
  hasForwardMarker,
  extractForwardedSender,
  extractSpotifyLink,
  extractTemplateFields,
  nameSimilarity,
} from "@/lib/email-parser";

// Minimum bigram similarity score to trigger a Tier 2 fuzzy match prompt.
const FUZZY_THRESHOLD = 0.4;

// SendGrid occasionally sends a GET to verify the endpoint is reachable.
export async function GET() {
  return new Response("OK", { status: 200 });
}

export async function POST(request: Request) {
  try {
    // ── 1. Parse multipart form data from SendGrid ─────────────────────────
    const formData = await request.formData();

    const rawTo      = (formData.get("to")       as string) ?? "";
    const rawFrom    = (formData.get("from")      as string) ?? "";
    const rawCc      = (formData.get("cc")        as string) ?? "";
    const subject    = (formData.get("subject")   as string) ?? "";
    const textBody   = (formData.get("text")      as string) ?? "";
    const htmlBody   = (formData.get("html")      as string) ?? "";
    const rawEnvelope = (formData.get("envelope") as string) ?? "{}";

    let envelope: { from?: string; to?: string[] } = {};
    try { envelope = JSON.parse(rawEnvelope); } catch { /* malformed — ignore */ }

    // ── 2. Identify the user from the inbound address ──────────────────────
    // SendGrid's envelope.to is the authoritative list of actual delivery
    // addresses (includes BCC recipients the To header doesn't show).
    const envelopeTo: string[] = envelope.to ?? [];
    const inboundAddr = envelopeTo.find(isInboundAddress);

    if (!inboundAddr) {
      console.warn("[inbound-email] No @wavelength-rts.com address in envelope.to", { envelopeTo });
      return new Response("No inbound address", { status: 400 });
    }

    const username = inboundAddr.split("@")[0].toLowerCase();

    const supabase = createAdminClient();

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("id, email, username")
      .eq("username", username)
      .single();

    if (!profile) {
      console.warn("[inbound-email] Unknown username:", username);
      return new Response("User not found", { status: 404 });
    }

    // ── 3. Detect scenario and whether this is a forwarded email ──────────
    // Scenario B: the sender IS the user (BCC'd their own inbound address).
    // Scenario A: the sender is someone else (e.g. Carl), looping the user in.
    // Forward:    subject starts with Fwd:/FW: or body has a forward marker.
    //             Artist is the original sender buried in the quoted body —
    //             NOT the To header (which just contains the inbound address).
    const sender = parseEmailAddress(rawFrom);
    const isScenarioB =
      !!profile.email &&
      sender.email.toLowerCase() === profile.email.toLowerCase();
    const isForwardedEmail = isForward(subject) || hasForwardMarker(textBody);

    // Forwards are always treated as incoming artist emails (like carl_bcc)
    // regardless of who did the forwarding.
    const emailSource = isForwardedEmail
      ? "carl_bcc"
      : isScenarioB
      ? "user_bcc"
      : "carl_bcc";

    // ── 4. Find the artist ─────────────────────────────────────────────────
    let artistAddr: ReturnType<typeof parseEmailAddress> | undefined;

    if (isForwardedEmail) {
      // For forwards the To header is just the inbound address — the real
      // artist is the original sender quoted in the body.
      // Try plain text first (more reliable), fall back to HTML.
      artistAddr =
        extractForwardedSender(textBody) ??
        extractForwardedSender(htmlBody) ??
        undefined;
    } else {
      // Normal BCC: artist is the primary To address (excluding inbound).
      const toAddresses = parseAddressList(rawTo).filter(a => !isInboundAddress(a.email));
      const ccAddresses = parseAddressList(rawCc).filter(a => !isInboundAddress(a.email));
      artistAddr = toAddresses[0] ?? ccAddresses[0];
    }

    if (!artistAddr?.email) {
      console.warn("[inbound-email] Could not identify artist address",
        { rawTo, rawCc, isForwardedEmail, subject });
      return new Response("Artist not identifiable", { status: 422 });
    }

    // ── 5. Extract content ─────────────────────────────────────────────────
    const fullBody      = `${textBody} ${htmlBody}`;
    const spotifyLink   = extractSpotifyLink(fullBody);
    const templateFields = extractTemplateFields(textBody); // Phase 5 hooks

    const today = new Date().toISOString().split("T")[0];

    // ── 6. Contact matching — Tier 1: exact email ──────────────────────────
    const { data: emailMatch } = await supabase
      .from("contacts")
      .select("id, spotify_track_link")
      .eq("user_id", profile.id)
      .ilike("email", artistAddr.email)
      .maybeSingle();

    if (emailMatch) {
      const updates: Record<string, unknown> = {
        is_new: true,
        email_source: emailSource,
        last_contact_date: today,
        last_interaction_type: "Email",
      };
      // Only overwrite Spotify link if the contact doesn't have one yet
      if (spotifyLink && !emailMatch.spotify_track_link) {
        updates.spotify_track_link = spotifyLink;
      }
      // Apply Phase 5 template fields (non-null values only)
      for (const [key, val] of Object.entries(templateFields)) {
        if (val) updates[key] = val;
      }
      // Only update status for a user BCC (their outgoing reply).
      // Forwards are incoming from the artist — don't flip status.
      if (isScenarioB && !isForwardedEmail) {
        updates.conversation_status = "Replied (Waiting on Them)";
        updates.waiting_on = "Them";
      }
      await supabase.from("contacts").update(updates).eq("id", emailMatch.id);
      return Response.json({ tier: 1, action: "updated", id: emailMatch.id });
    }

    // ── 7. Contact matching — Tier 2: fuzzy name ──────────────────────────
    if (artistAddr.name) {
      const { data: allContacts } = await supabase
        .from("contacts")
        .select("id, artist_band, contact_name")
        .eq("user_id", profile.id);

      let bestId: string | null = null;
      let bestName = "";
      let bestScore = 0;

      for (const c of allContacts ?? []) {
        const score = Math.max(
          nameSimilarity(artistAddr.name, c.artist_band),
          c.contact_name ? nameSimilarity(artistAddr.name, c.contact_name) : 0
        );
        if (score > bestScore) {
          bestScore = score;
          bestId = c.id;
          bestName = c.artist_band;
        }
      }

      if (bestId && bestScore >= FUZZY_THRESHOLD) {
        await supabase.from("pending_matches").insert({
          user_id: profile.id,
          artist_name: artistAddr.name,
          artist_email: artistAddr.email,
          spotify_track_link: spotifyLink ?? null,
          email_source: emailSource,
          raw_subject: subject || null,
          candidate_contact_id: bestId,
          candidate_contact_name: bestName,
          status: "pending",
          // Store Phase 5 template fields so they can be applied on resolution
          template_fields: templateFields,
        });
        return Response.json({ tier: 2, action: "pending_match" });
      }
    }

    // ── 8. Contact matching — Tier 3: no match — create new ───────────────
    const artistBand =
      artistAddr.name ||
      artistAddr.email.split("@")[0].replace(/[._-]/g, " ");

    const newContact: Record<string, unknown> = {
      user_id: profile.id,
      artist_band: artistBand,
      email: artistAddr.email,
      first_contact_date: today,
      last_contact_date: today,
      last_interaction_type: "Email",
      is_new: true,
      email_source: emailSource,
      // Forwards are always incoming from the artist, so treat like Scenario A.
      conversation_status: isScenarioB && !isForwardedEmail
        ? "Replied (Waiting on Them)"
        : "New Reply (Needs Response)",
      waiting_on: isScenarioB && !isForwardedEmail ? "Them" : "Me",
    };

    if (spotifyLink) newContact.spotify_track_link = spotifyLink;
    // Apply Phase 5 template fields
    for (const [key, val] of Object.entries(templateFields)) {
      if (val) newContact[key] = val;
    }

    const { data: created } = await supabase
      .from("contacts")
      .insert(newContact)
      .select("id")
      .single();

    return Response.json({ tier: 3, action: "created", id: created?.id });

  } catch (err) {
    console.error("[inbound-email] Unhandled error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
