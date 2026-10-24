import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Every blog-panel page calls this itself (same reasoning as adminGuard): signed in, BLOGGER, and the byline exists. */
export async function bloggerGuard() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "BLOGGER") redirect("/giris");
  const author = await prisma.blogAuthor.findUnique({ where: { userId: session.user.id }, include: { user: { select: { name: true, email: true, avatarUrl: true } } } });
  if (!author) redirect("/giris");
  return { session, author };
}
