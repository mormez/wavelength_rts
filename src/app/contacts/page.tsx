import { createClient } from "@/lib/supabase/server";
import ContactList from "@/components/ContactList";
import PendingMatchBanner, { PendingMatch } from "@/components/PendingMatchBanner";
import { Contact } from "@/lib/types";

export default async function ContactsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: contacts }, { data: profile }, { data: pendingMatches }] =
    await Promise.all([
      supabase
        .from("contacts")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("user_profiles")
        .select("username")
        .eq("id", user!.id)
        .single(),
      supabase
        .from("pending_matches")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "pending")
        .order("created_at", { ascending: true }),
    ]);

  return (
    <>
      <PendingMatchBanner
        initialMatches={(pendingMatches as PendingMatch[]) ?? []}
      />
      <ContactList
        initialContacts={(contacts as Contact[]) ?? []}
        username={profile?.username ?? ""}
      />
    </>
  );
}
