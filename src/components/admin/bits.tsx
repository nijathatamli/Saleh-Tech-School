import Link from "next/link";
import { Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const PAYMENT_LABEL: Record<string, string> = { DUE: "Ödəniş vaxtıdır", PAID: "Ödənilib", PENDING: "Gözləyir", OVERDUE: "Gecikib", CANCELLED: "Ləğv edilib" };
const PAYMENT_VARIANT: Record<string, "warning" | "success" | "default" | "danger"> = { DUE: "warning", PAID: "success", PENDING: "default", OVERDUE: "danger", CANCELLED: "default" };

export function PaymentBadge({ status }: { status: string }) {
  return <Badge variant={PAYMENT_VARIANT[status] ?? "default"}>{PAYMENT_LABEL[status] ?? status}</Badge>;
}

export function ClassStatusBadge({ status }: { status: string }) {
  return <Badge variant={status === "ACTIVE" ? "success" : "default"}>{status === "ACTIVE" ? "Aktiv" : "Arxivdə"}</Badge>;
}

export const card = "rounded-[26px] border border-[rgba(23,23,23,0.05)] bg-white shadow-[0_1px_2px_rgba(23,23,23,0.03)]";
export const th = "px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-widest text-navy-400";

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
        {page > 1 && <Link href={href(page - 1)} className="rounded-[12px] border border-navy-100 bg-white px-4 py-1.5 font-semibold text-navy-900 transition-colors hover:bg-navy-50">Əvvəlki</Link>}
        {page < pages && <Link href={href(page + 1)} className="rounded-[12px] border border-navy-100 bg-white px-4 py-1.5 font-semibold text-navy-900 transition-colors hover:bg-navy-50">Növbəti</Link>}
      </div>
    </div>
  );
}

export const fmtDate = (d: Date | string | null | undefined) =>
  d ? new Intl.DateTimeFormat("az-AZ", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Baku" }).format(new Date(d)) : "—";

/** A list with nothing in it: says so, and (for filtered lists) what to try — never a blank white box. */
export function EmptyState({ text, hint }: { text: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center">
      <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-black/[0.04] text-navy-400">
        <Inbox className="h-5 w-5" />
      </span>
      <p className="font-display text-[15px] text-navy-900">{text}</p>
      {hint && <p className="max-w-sm text-[13px] text-navy-400">{hint}</p>}
    </div>
  );
}
