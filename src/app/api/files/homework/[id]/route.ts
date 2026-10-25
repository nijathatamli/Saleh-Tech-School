import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canDownload, contentDisposition, isInline } from "@/lib/homework-files";

export const dynamic = "force-dynamic";

/** Download of a homework attachment. Signed-in users only, and only people the homework concerns; always a fixed
 *  content type, `nosniff`, and an attachment disposition (pictures may show inline). */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401, headers: { "Cache-Control": "no-store" } });
  const row = await prisma.homeworkFile.findUnique({ where: { id: params.id } });
  const user = { id: session.user.id, role: session.user.role };
  if (!row || !(await canDownload(user, row))) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  return new Response(new Uint8Array(row.data), {
    headers: {
      "Content-Type": row.mime,
      "Content-Length": String(row.size),
      "Content-Disposition": contentDisposition(row.filename, isInline(row.mime)),
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cache-Control": "private, max-age=300",
    },
  });
}
