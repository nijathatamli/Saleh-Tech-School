"use server";

// Server actions behind the parent portal's buttons: notifications, profile,
// avatar and notification preferences. Every action re-checks the session and
// only touches rows owned by the signed-in parent.
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PORTAL = "/parent";

async function parentSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "PARENT") return null;
  return session;
}

export async function markAllAsRead() {
  const session = await parentSession();
  if (!session) return;
  await prisma.notification.updateMany({ where: { userId: session.user.id, read: false }, data: { read: true } });
  revalidatePath(PORTAL, "layout");
}

export async function markOneAsRead(notificationId: string) {
  const session = await parentSession();
  if (!session) return;
  await prisma.notification.updateMany({
    where: { id: notificationId, userId: session.user.id },
    data: { read: true },
  });
  revalidatePath(PORTAL, "layout");
}

const profileSchema = z.object({ name: z.string().min(3), phone: z.string().min(9) });

export async function updateProfile(formData: FormData) {
  const session = await parentSession();
  if (!session) return { ok: false as const, error: "unauthorized" as const };

  const parsed = profileSchema.safeParse({ name: formData.get("name"), phone: formData.get("phone") });
  if (!parsed.success) return { ok: false as const, error: "invalid" as const };

  await prisma.user.update({ where: { id: session.user.id }, data: parsed.data });
  revalidatePath(PORTAL, "layout");
  return { ok: true as const };
}

export async function updateAvatar(avatarUrl: string) {
  const session = await parentSession();
  if (!session) return;

  await prisma.user.update({ where: { id: session.user.id }, data: { avatarUrl } });
  revalidatePath(PORTAL, "layout");
}

const prefsSchema = z.object({ lessons: z.boolean(), grades: z.boolean() });

export async function updateNotificationPrefs(prefs: { lessons: boolean; grades: boolean }) {
  const session = await parentSession();
  if (!session) return;
  const parsed = prefsSchema.safeParse(prefs);
  if (!parsed.success) return;

  await prisma.parentProfile.update({
    where: { userId: session.user.id },
    data: { notifyLessons: parsed.data.lessons, notifyGrades: parsed.data.grades },
  });
  revalidatePath(PORTAL, "layout");
}
