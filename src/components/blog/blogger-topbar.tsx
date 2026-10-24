import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AppTopbar } from "@/components/app/topbar";

export async function BloggerTopbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const session = await getServerSession(authOptions);
  return <AppTopbar title={title} subtitle={subtitle} userName={session?.user?.name ?? "Müəllif"} userEmail={session?.user?.email ?? ""} settingsHref="/blogger/profil" hideBell />;
}
