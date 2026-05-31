import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("username, full_name, plan")
    .eq("id", user.id)
    .single();

  if (!profile?.username) redirect("/onboarding");

  return (
    <AppShell
      userEmail={user.email ?? ""}
      userName={profile.full_name ?? user.email ?? ""}
      username={profile.username}
      plan={profile.plan ?? "free"}
    >
      {children}
    </AppShell>
  );
}
