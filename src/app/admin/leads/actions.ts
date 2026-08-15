"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const order = ["NEW", "CONTACTED", "TRIAL_LESSON", "TRIAL_COMPLETED", "INTERESTED", "REGISTERED"] as const;

export async function advanceLeadStage(leadId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") return;

  const lead = await prisma.trialBooking.findUnique({ where: { id: leadId } });
  if (!lead) return;

  const idx = order.indexOf(lead.stage as (typeof order)[number]);
  if (idx === -1 || idx === order.length - 1) return;

  await prisma.trialBooking.update({ where: { id: leadId }, data: { stage: order[idx + 1] } });
  revalidatePath("/admin/leads");
}
