import { CreditCard, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { getCurrentParent } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { DashTopbar } from "@/components/dash/topbar";
import { DashStatCard } from "@/components/dash/stat-card";
import { DashCard } from "@/components/dash/card";
import { DashEmptyState } from "@/components/dash/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatAzn, formatDate } from "@/lib/utils";
import { getServerDictionary, topbarLabels } from "@/i18n/server";
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

  const { locale, dict } = getServerDictionary();
  const meta = statusMeta(dict);

  const payments = await prisma.payment.findMany({
    where: { parentId: parent.id },
    orderBy: { dueDate: "desc" },
  });

  const paid = payments.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0);
  const pending = payments.filter((p) => p.status === "PENDING").reduce((s, p) => s + p.amount, 0);
  const overdue = payments.filter((p) => p.status === "OVERDUE").reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <DashTopbar
        title={dict.payments.title}
        userName={parent.user.name}
        userEmail={parent.user.email}
        locale={locale}
        labels={topbarLabels(dict)}
        settingsHref="/parent/settings"
        showMobileMenuTrigger={false}
      />

      <div className="space-y-8 p-6 md:p-10">
        <div className="grid gap-4 sm:grid-cols-3">
          <DashStatCard label={dict.payments.paid} value={formatAzn(paid)} icon={CheckCircle2} color="teal" />
          <DashStatCard label={dict.payments.pendingBalance} value={formatAzn(pending)} icon={Clock} color="amber" />
          <DashStatCard label={dict.payments.overdue} value={formatAzn(overdue)} icon={AlertCircle} color="electric" />
        </div>

        <DashCard className="p-0">
          <h3 className="border-b border-dash-rule p-6 font-display text-base text-dash-ink dark:border-dash-dark-rule dark:text-white">
            {dict.payments.historyTitle}
          </h3>
          {payments.length === 0 ? (
            <div className="p-6">
              <DashEmptyState icon={CreditCard} title={dict.payments.noneTitle} />
            </div>
          ) : (
            <div className="divide-y divide-dash-rule dark:divide-dash-dark-rule">
              {payments.map((p) => {
                const m = meta[p.status];
                const needsAction = p.status !== "PAID";
                return (
                  <div key={p.id} className="flex flex-wrap items-center gap-4 p-5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-dash-paper-2 text-dash-ink/50 dark:bg-white/5 dark:text-white/50">
                      <m.icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-dash-ink dark:text-white">{p.title}</p>
                      <p className="text-xs text-dash-ink/50 dark:text-white/40">
                        {dict.payments.invoice} #{p.invoiceNo} · {dict.payments.dueDate} {formatDate(p.dueDate)}
                      </p>
                    </div>
                    <span className="font-bold text-dash-ink dark:text-white">{formatAzn(p.amount)}</span>
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
