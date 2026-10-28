import Link from "next/link";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const PAYMENT_LABEL: Record<string, string> = { DUE: "Ödəniş vaxtıdır", PAID: "Ödənilib", PENDING: "Gözləyir", OVERDUE: "Gecikib", CANCELLED: "Ləğv edilib" };
const PAYMENT_VARIANT: Record<string, "warning" | "success" | "default" | "danger" | "violet"> = { DUE: "warning", PAID: "success", PENDING: "violet", OVERDUE: "danger", CANCELLED: "default" };

export function PaymentBadge({ status }: { status: string }) {
  return <Badge variant={PAYMENT_VARIANT[status] ?? "default"}>{PAYMENT_LABEL[status] ?? status}</Badge>;
}

export function ClassStatusBadge({ status }: { status: string }) {
  return <Badge variant={status === "ACTIVE" ? "success" : "default"}>{status === "ACTIVE" ? "Aktiv" : "Arxivdə"}</Badge>;
}

export const card = "ad-card"; // the look lives in admin.css (.ad-card): white card, 10px radius, hairline shadow; a card with a table is the grey panel the white rows sit on
export type Tone = "blue" | "violet" | "lilac" | "mint" | "sand";
const TONES: Tone[] = ["blue", "violet", "lilac", "mint", "sand"];
export const toneAt = (i: number): Tone => TONES[i % TONES.length];

/** A pastel number tile (label, big number, optional hint) — the stat boxes of every admin page. Links when `href` is given. */
export function StatTile({ label, value, hint, tone = "blue", href, active }: { label: string; value: React.ReactNode; hint?: string; tone?: Tone; href?: string; active?: boolean }) {
  const body = (
    <>
      <div className="t-top"><span>{label}</span></div>
      <p className="t-num">{value}</p>
      {hint && <p className="mt-1.5 text-xs text-navy-400">{hint}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="ad-tile" data-tone={tone} data-active={active ? "true" : undefined}>{body}</Link>
  ) : (
    <div className="ad-tile" data-tone={tone}>{body}</div>
  );
}

export const th = "px-4 py-3 text-left text-xs font-semibold text-navy-600";

/** 1 2 [3] … 19 20 — the current page, its neighbours, the first and the last. */
function pageList(page: number, pages: number): (number | "…")[] {
  const keep = new Set([1, 2, pages - 1, pages, page - 1, page, page + 1]);
  const out: (number | "…")[] = [];
  for (let i = 1; i <= pages; i++) {
    if (!keep.has(i)) continue;
    if (out.length && typeof out[out.length - 1] === "number" && i - (out[out.length - 1] as number) > 1) out.push("…");
    out.push(i);
  }
  return out;
}

export function Pagination({ base, params, page, total, size }: { base: string; params: Record<string, string | undefined>; page: number; total: number; size: number }) {
  const pages = Math.max(1, Math.ceil(total / size));
  const cur = Math.min(page, pages);
  const href = (p: number) => {
    const qs = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => !!e[1]));
    qs.set("page", String(p));
    return `${base}?${qs}`;
  };
  return (
    <div className="ad-pager">
      <span>{total} nəticə · səhifə {cur} / {pages}</span>
      {pages > 1 && (
        <nav aria-label="Səhifələr">
          {cur > 1 ? (
            <Link href={href(cur - 1)} aria-label="Əvvəlki" rel="prev"><ChevronLeft /></Link>
          ) : (
            <span className="ad-pg" aria-disabled="true"><ChevronLeft aria-hidden="true" /></span>
          )}
          {pageList(cur, pages).map((p, i) =>
            p === "…" ? (
              <span key={`g${i}`} className="ad-pg" aria-hidden="true">…</span>
            ) : (
              <Link key={p} href={href(p)} aria-current={p === cur ? "page" : undefined} aria-label={`Səhifə ${p}`}>{p}</Link>
            )
          )}
          {cur < pages ? (
            <Link href={href(cur + 1)} aria-label="Növbəti" rel="next"><ChevronRight /></Link>
          ) : (
            <span className="ad-pg" aria-disabled="true"><ChevronRight aria-hidden="true" /></span>
          )}
        </nav>
      )}
    </div>
  );
}

export const fmtDate = (d: Date | string | null | undefined) =>
  d ? new Intl.DateTimeFormat("az-AZ", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Baku" }).format(new Date(d)) : "—";

/** A list with nothing in it: says so, and (for filtered lists) what to try — never a blank white box. */
export function EmptyState({ text, hint }: { text: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center">
      <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#eef1f7] text-navy-400">
        <Inbox className="h-5 w-5" />
      </span>
      <p className="font-display text-[15px] text-navy-900">{text}</p>
      {hint && <p className="max-w-sm text-[13px] text-navy-400">{hint}</p>}
    </div>
  );
}
