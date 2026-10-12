import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Every admin page calls this itself. The layout checks the session too, but a layout is not re-rendered on
 * client-side navigation, and the middleware only sees the signed cookie — this is the check that also notices
 * a deactivated administrator (the session callback re-reads the account).
 */
export async function adminGuard() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/giris");
  return session;
}
