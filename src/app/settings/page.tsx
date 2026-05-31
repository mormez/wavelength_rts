import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SettingsClient from "@/components/SettingsClient";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("username, full_name, plan")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/onboarding");

  return (
    <SettingsClient
      email={user.email ?? ""}
      fullName={profile.full_name ?? ""}
      username={profile.username}
      plan={profile.plan ?? "free"}
    />
  );
}
