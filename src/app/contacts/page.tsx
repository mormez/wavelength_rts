import { createClient } from "@/lib/supabase/server";
import ContactList from "@/components/ContactList";
import { Contact } from "@/lib/types";

export default async function ContactsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: contacts }, { data: profile }] = await Promise.all([
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
  ]);

  return (
    <ContactList
      initialContacts={(contacts as Contact[]) ?? []}
      username={profile?.username ?? ""}
    />
  );
}
