import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";

export default async function ContactsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check onboarding complete
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("username, full_name, plan")
    .eq("id", user.id)
    .single();

  if (!profile?.username) redirect("/onboarding");

  // Clear is_new on login (bulk update)
  await supabase
    .from("contacts")
    .update({ is_new: false })
    .eq("user_id", user.id)
    .eq("is_new", true);

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
