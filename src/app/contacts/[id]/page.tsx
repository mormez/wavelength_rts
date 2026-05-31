import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Contact } from "@/lib/types";
import ArtistDetailClient from "@/components/ArtistDetailClient";

export default async function ArtistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: contact, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !contact) notFound();

  // Fetch all contacts for the switch dropdown
  const { data: allContacts } = await supabase
    .from("contacts")
    .select("id, artist_band")
    .eq("user_id", user.id)
    .order("artist_band", { ascending: true });

  return (
    <ArtistDetailClient
      contact={contact as Contact}
      allContacts={(allContacts ?? []) as Pick<Contact, "id" | "artist_band">[]}
    />
  );
}
