import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export const PAYMENT_LABEL: Record<string, string> = { DUE: "Ödəniş vaxtıdır", PAID: "Ödənilib", PENDING: "Gözləyir", OVERDUE: "Gecikib", CANCELLED: "Ləğv edilib" };
const PAYMENT_VARIANT: Record<string, "warning" | "success" | "default" | "danger"> = { DUE: "warning", PAID: "success", PENDING: "default", OVERDUE: "danger", CANCELLED: "default" };

export function PaymentBadge({ status }: { status: string }) {
  return <Badge variant={PAYMENT_VARIANT[status] ?? "default"}>{PAYMENT_LABEL[status] ?? status}</Badge>;
}

export function ClassStatusBadge({ status }: { status: string }) {
  return <Badge variant={status === "ACTIVE" ? "success" : "default"}>{status === "ACTIVE" ? "Aktiv" : "Arxivdə"}</Badge>;
}

export const card = "rounded-2xl border border-navy-100 bg-white shadow-sm shadow-navy-900/[0.03]";
export const th = "px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-navy-400";

export function Pagination({ base, params, page, total, size }: { base: string; params: Record<string, string | undefined>; page: number; total: number; size: number }) {
  const pages = Math.max(1, Math.ceil(total / size));
  const href = (p: number) => {
    const qs = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => !!e[1]));
    qs.set("page", String(p));
    return `${base}?${qs}`;
  };
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm text-navy-400">
      <span>{total} nəticə · səhifə {Math.min(page, pages)} / {pages}</span>
      <div className="flex gap-2">
        {page > 1 && <Link href={href(page - 1)} className="rounded-full border border-navy-100 px-4 py-1.5 font-bold text-navy-900 hover:bg-navy-50">Əvvəlki</Link>}
        {page < pages && <Link href={href(page + 1)} className="rounded-full border border-navy-100 px-4 py-1.5 font-bold text-navy-900 hover:bg-navy-50">Növbəti</Link>}
      </div>
    </div>
  );
}

export const fmtDate = (d: Date | string | null | undefined) =>
  d ? new Intl.DateTimeFormat("az-AZ", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Baku" }).format(new Date(d)) : "—";
