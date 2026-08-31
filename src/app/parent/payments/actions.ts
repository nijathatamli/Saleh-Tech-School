"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function submitPaymentReceipt(paymentId: string, receiptUrl: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "PARENT") return;

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { parent: true },
  });
  if (!payment || payment.parent.userId !== session.user.id) return;
  if (payment.status === "PAID") return;

  await prisma.payment.update({
    where: { id: paymentId },
    data: { receiptUrl, receiptSubmittedAt: new Date(), status: "PENDING" },
  });

  revalidatePath("/parent/payments");
}
