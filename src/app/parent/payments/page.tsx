import { CreditCard, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { getCurrentParent } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { AppTopbar } from "@/components/app/topbar";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatAzn, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const statusMeta = {
  PAID: { label: "Ödənilib", variant: "success" as const, icon: CheckCircle2 },
  PENDING: { label: "Gözləyir", variant: "warning" as const, icon: Clock },
  OVERDUE: { label: "Gecikmiş", variant: "danger" as const, icon: AlertCircle },
};

export default async function PaymentsPage() {
  const parent = await getCurrentParent();
  if (!parent) return null;

  const payments = await prisma.payment.findMany({
    where: { parentId: parent.id },
    orderBy: { dueDate: "desc" },
  });

  const paid = payments.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0);
  const pending = payments.filter((p) => p.status === "PENDING").reduce((s, p) => s + p.amount, 0);
  const overdue = payments.filter((p) => p.status === "OVERDUE").reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <AppTopbar title="Ödənişlər" userName={parent.user.name} userEmail={parent.user.email} />

      <div className="space-y-8 p-6 md:p-10">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Ödənilib" value={formatAzn(paid)} icon={CheckCircle2} color="emerald" />
          <StatCard label="Gözləyən balans" value={formatAzn(pending)} icon={Clock} color="amber" />
          <StatCard label="Gecikmiş" value={formatAzn(overdue)} icon={AlertCircle} color="electric" />
        </div>

        <div className="rounded-2xl border border-navy-100 bg-white shadow-sm shadow-navy-900/[0.03]">
          <h3 className="border-b border-navy-100 p-6 font-display text-base text-navy-900">Ödəniş tarixçəsi</h3>
          {payments.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={CreditCard} title="Hələ ödəniş qeydi yoxdur" />
            </div>
          ) : (
            <div className="divide-y divide-navy-100">
              {payments.map((p) => {
                const meta = statusMeta[p.status];
                return (
                  <div key={p.id} className="flex items-center gap-4 p-5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-400">
                      <meta.icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-navy-900">{p.title}</p>
                      <p className="text-xs text-navy-400">
                        Faktura #{p.invoiceNo} · Son tarix {formatDate(p.dueDate)}
                      </p>
                    </div>
                    <span className="font-bold text-navy-900">{formatAzn(p.amount)}</span>
                    <Badge variant={meta.variant} size="md">{meta.label}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
