import { CreditCard, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { getCurrentParent } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { ParentPageHeader } from "@/components/dash/parent-page-header";
import { DashStatCard } from "@/components/dash/stat-card";
import { DashCard } from "@/components/dash/card";
import { DashEmptyState } from "@/components/dash/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatAzn, formatDate } from "@/lib/utils";
import { getServerDictionary } from "@/i18n/server";
import type { Dictionary } from "@/i18n";
import { ReceiptUpload } from "./receipt-upload";

export const dynamic = "force-dynamic";

function statusMeta(dict: Dictionary) {
  return {
    PAID: { label: dict.payments.statusPaid, variant: "success" as const, icon: CheckCircle2 },
    PENDING: { label: dict.payments.statusPending, variant: "warning" as const, icon: Clock },
    OVERDUE: { label: dict.payments.statusOverdue, variant: "danger" as const, icon: AlertCircle },
  };
}

export default async function PaymentsPage() {
  const parent = await getCurrentParent();
  if (!parent) return null;

  const { dict } = getServerDictionary();
  const meta = statusMeta(dict);

  const payments = await prisma.payment.findMany({
    where: { parentId: parent.id },
    orderBy: { dueDate: "desc" },
  });

  const paid = payments.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0);
  const pending = payments.filter((p) => p.status === "PENDING").reduce((s, p) => s + p.amount, 0);
  const overdue = payments.filter((p) => p.status === "OVERDUE").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="mx-auto max-w-[1240px]">
      <ParentPageHeader title={dict.payments.title} />

      <div className="space-y-6 px-6 pb-20 md:px-11">
        <div className="grid gap-5 sm:grid-cols-3">
          <DashStatCard label={dict.payments.paid} value={formatAzn(paid)} icon={CheckCircle2} color="teal" className="rounded-[22px] p-[26px]" />
          <DashStatCard label={dict.payments.pendingBalance} value={formatAzn(pending)} icon={Clock} color="amber" className="rounded-[22px] p-[26px]" />
          <DashStatCard label={dict.payments.overdue} value={formatAzn(overdue)} icon={AlertCircle} color="electric" className="rounded-[22px] p-[26px]" />
        </div>

        <DashCard className="rounded-[22px] p-0">
          <h3 className="border-b border-dash-ink/[0.06] p-6 font-display text-[19px] font-semibold tracking-[-0.02em] dark:border-white/10">
            {dict.payments.historyTitle}
          </h3>
          {payments.length === 0 ? (
            <div className="p-6">
              <DashEmptyState icon={CreditCard} title={dict.payments.noneTitle} />
            </div>
          ) : (
            <div className="divide-y divide-dash-ink/[0.06] dark:divide-white/10">
              {payments.map((p) => {
                const m = meta[p.status];
                const needsAction = p.status !== "PAID";
                return (
                  <div key={p.id} className="flex flex-wrap items-center gap-4 p-6">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-dash-paper-2 text-dash-ink/50 dark:bg-white/5 dark:text-white/50">
                      <m.icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14.5px] font-semibold">{p.title}</p>
                      <p className="text-xs text-grey-500">
                        {dict.payments.invoice} #{p.invoiceNo} · {dict.payments.dueDate} {formatDate(p.dueDate)}
                      </p>
                    </div>
                    <span className="font-semibold">{formatAzn(p.amount)}</span>
                    <Badge variant={m.variant} size="md">{m.label}</Badge>
                    {needsAction && (
                      <ReceiptUpload
                        paymentId={p.id}
                        label={dict.payments.uploadCheque}
                        submittedLabel={dict.payments.awaitingReview}
                        alreadySubmitted={!!p.receiptUrl && p.status === "PENDING"}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </DashCard>
      </div>
    </div>
  );
}
