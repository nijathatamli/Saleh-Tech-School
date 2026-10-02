import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { isLang, type Lang } from "./i18n";
import { SESSION_COOKIE, readSessionToken } from "./security";

export type SessionStudent = {
  id: string;
  name: string;
  surname: string;
  categoryKey: string;
  categoryLabel: string;
  language: Lang;
};

/** The signed-in scholarship candidate (from the httpOnly cookie), or null. Always re-checked against the DB. */
export async function getSessionStudent(): Promise<SessionStudent | null> {
  const id = await readSessionToken(cookies().get(SESSION_COOKIE)?.value);
  if (!id) return null;
  const s = await prisma.scholarshipStudent.findUnique({
    where: { id },
    select: { id: true, name: true, surname: true, categoryKey: true, language: true, category: { select: { label: true } } },
  });
  if (!s) return null;
  return { id: s.id, name: s.name, surname: s.surname, categoryKey: s.categoryKey, categoryLabel: s.category.label, language: isLang(s.language) ? s.language : "az" };
}
