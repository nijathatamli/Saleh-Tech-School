"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bold, Code, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, Minus, Quote, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BlogMarkdown } from "@/components/blog/markdown";
import { uploadImage } from "@/components/blog/upload";
import { api } from "@/lib/client-api";
import { categoryLabels } from "@/lib/blog/categories";
import { readingMinutes, slugify, wordCount } from "@/lib/blog/text";
import { MIN_PUBLISH_CHARS } from "@/lib/blog/constants";

export type EditorPost = {
  id: string; slug: string; title: string; excerpt: string; content: string; coverUrl: string | null; coverAlt: string; category: string; tags: string[];
  status: "DRAFT" | "PUBLISHED"; publishedAt: string | null; metaTitle: string; metaDescription: string; views: number;
};

const field = "w-full rounded-xl border border-navy-100 bg-white px-4 py-3 text-sm text-navy-900 focus:border-electric-500";
const box = "rounded-[22px] border border-[rgba(23,23,23,0.06)] bg-white p-5 shadow-[0_1px_2px_rgba(23,23,23,0.03)]";
const err = (m?: string) => (m ? <p role="alert" className="mt-1.5 text-xs font-semibold text-red-500">{m}</p> : null);

/** <input type="datetime-local"> value (browser's local time) from an ISO instant, and back. */
const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export function PostEditor({ initial }: { initial?: EditorPost }) {
  const router = useRouter();
  const [id, setId] = useState(initial?.id ?? null);
  const [f, setF] = useState({
    title: initial?.title ?? "", slug: initial?.slug ?? "", excerpt: initial?.excerpt ?? "", content: initial?.content ?? "", coverUrl: initial?.coverUrl ?? null as string | null,
    coverAlt: initial?.coverAlt ?? "", category: initial?.category ?? categoryLabels[0], tags: initial?.tags ?? ([] as string[]), metaTitle: initial?.metaTitle ?? "", metaDescription: initial?.metaDescription ?? "",
  });
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">(initial?.status ?? "DRAFT");
  const [publishAt, setPublishAt] = useState(toLocalInput(initial?.publishedAt ?? null));
  const [slugTouched, setSlugTouched] = useState(!!initial);
  const [tagInput, setTagInput] = useState("");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState<null | "draft" | "publish" | "upload" | "delete">(null);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [host, setHost] = useState("sayt.az");
  useEffect(() => setHost(window.location.host), []);
  const area = useRef<HTMLTextAreaElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const bodyInput = useRef<HTMLInputElement>(null);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => {
    setF((p) => ({ ...p, [k]: v }));
    setDirty(true);
  };

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const words = useMemo(() => wordCount(f.content), [f.content]);
  const scheduled = !!publishAt && new Date(publishAt) > new Date();

  const checks = [
    { ok: f.title.trim().length >= 5, text: "Başlıq (ən az 5 simvol)" },
    { ok: f.content.trim().length >= MIN_PUBLISH_CHARS, text: `Mətn (ən az ${MIN_PUBLISH_CHARS} simvol)` },
    { ok: !!f.coverUrl, text: "Qapaq şəkli" },
    { ok: !!f.coverUrl && !!f.coverAlt.trim(), text: "Şəklin təsviri (alt mətn)" },
    { ok: f.metaDescription.trim().length >= 70, text: "SEO təsviri (tövsiyə: 70–160 simvol)", soft: true },
    { ok: f.tags.length > 0, text: "Ən azı bir etiket (tövsiyə)", soft: true },
  ];
  const ready = checks.filter((c) => !("soft" in c)).every((c) => c.ok);

  // ---- editor toolbar: operate on the textarea's selection ----
  const edit = useCallback(
    (fn: (sel: string, before: string, after: string) => { text: string; select?: [number, number] }) => {
      const el = area.current;
      if (!el) return;
      const { selectionStart: a, selectionEnd: b, value } = el;
      const r = fn(value.slice(a, b), value.slice(0, a), value.slice(b));
      const next = value.slice(0, a) + r.text + value.slice(b);
      set("content", next);
      requestAnimationFrame(() => {
        el.focus();
        const s = r.select ?? [a + r.text.length, a + r.text.length];
        el.setSelectionRange(a + s[0], a + s[1]);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const wrap = (mark: string, placeholder: string) => edit((sel) => ({ text: `${mark}${sel || placeholder}${mark}`, select: [mark.length, mark.length + (sel || placeholder).length] }));
  const linePrefix = (prefix: (i: number) => string, placeholder: string) =>
    edit((sel, before) => {
      const lead = before.length === 0 || before.endsWith("\n") ? "" : "\n";
      const lines = (sel || placeholder).split("\n").map((l, i) => `${prefix(i)}${l}`);
      return { text: `${lead}${lines.join("\n")}\n`, select: [lead.length, lead.length + lines.join("\n").length] };
    });
  const link = () => {
    const url = window.prompt("Link ünvanı (https://… və ya /sinaq-dersi):", "https://");
    if (!url || url === "https://") return;
    edit((sel) => ({ text: `[${sel || "link mətni"}](${url})` }));
  };

  async function insertImage(file: File | undefined) {
    if (!file) return;
    setBusy("upload");
    setMsg(null);
    const r = await uploadImage(file);
    setBusy(null);
    if (!r.ok) return setMsg({ kind: "error", text: r.error });
    const alt = window.prompt("Şəklin qısa təsviri (alt mətn):", "") ?? "";
    edit(() => ({ text: `\n![${alt.replace(/[\]\[]/g, "")}](${r.url})\n` }));
  }

  async function setCover(file: File | undefined) {
    if (!file) return;
    setBusy("upload");
    setMsg(null);
    const r = await uploadImage(file);
    setBusy(null);
    if (!r.ok) return setMsg({ kind: "error", text: r.error });
    set("coverUrl", r.url);
  }

  function addTags(raw: string) {
    const add = raw.split(/[,\n]/).map((t) => t.trim().toLowerCase().replace(/^#/, "")).filter((t) => t.length >= 2);
    if (add.length) set("tags", Array.from(new Set([...f.tags, ...add])).slice(0, 8));
    setTagInput("");
  }

  async function save(target: "DRAFT" | "PUBLISHED") {
    setBusy(target === "DRAFT" ? "draft" : "publish");
    setMsg(null);
    setFields({});
    const body = {
      title: f.title, slug: f.slug || undefined, excerpt: f.excerpt, content: f.content, coverUrl: f.coverUrl, coverAlt: f.coverAlt, category: f.category, tags: f.tags,
      status: target, publishedAt: target === "PUBLISHED" && publishAt ? new Date(publishAt).toISOString() : null, metaTitle: f.metaTitle, metaDescription: f.metaDescription,
    };
    const r = await api<{ id: string; slug: string; status: "DRAFT" | "PUBLISHED" }>(id ? "PATCH" : "POST", id ? `/api/blogger/posts/${id}` : "/api/blogger/posts", body);
    setBusy(null);
    if (!r.ok) {
      setFields(r.fields ?? {});
      return setMsg({ kind: "error", text: r.error });
    }
    setStatus(r.data.status);
    setF((p) => ({ ...p, slug: r.data.slug }));
    setSlugTouched(true);
    setDirty(false);
    setSavedAt(new Date());
    const when = target === "PUBLISHED" ? (scheduled ? "Yazı planlandı." : "Yazı dərc olundu.") : "Qaralama saxlanıldı.";
    setMsg({ kind: "ok", text: when });
    if (!id) {
      setId(r.data.id);
      router.replace(`/blogger/yazilar/${r.data.id}`);
    } else router.refresh();
  }

  async function remove() {
    if (!id || !window.confirm("Bu yazı silinsin? Bu əməliyyat geri qaytarılmır.")) return;
    setBusy("delete");
    const r = await api("DELETE", `/api/blogger/posts/${id}`);
    if (!r.ok) {
      setBusy(null);
      return setMsg({ kind: "error", text: r.error });
    }
    setDirty(false);
    router.push("/blogger/yazilar");
    router.refresh();
  }

  const toolbarBtn = "flex h-9 w-9 items-center justify-center rounded-[10px] text-navy-600 transition-colors hover:bg-navy-50 hover:text-navy-900 disabled:opacity-40";
  const slugPreview = f.slug || slugify(f.title) || "yazi-unvani";
  const snippetTitle = f.metaTitle || f.title || "Yazının başlığı";
  const snippetDesc = f.metaDescription || f.excerpt || "Axtarış nəticəsində görünəcək qısa təsvir.";

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0 space-y-5">
        <div className={box}>
          <Label htmlFor="pe-title">Başlıq</Label>
          <Input
            id="pe-title"
            value={f.title}
            maxLength={120}
            placeholder="Məqalənin başlığı"
            onChange={(e) => {
              set("title", e.target.value);
              if (!slugTouched) setF((p) => ({ ...p, title: e.target.value, slug: slugify(e.target.value) }));
            }}
            className="mt-2 text-lg font-semibold"
          />
          {err(fields.title)}
          <p className="mt-1.5 text-right text-xs text-navy-400">{f.title.length}/120</p>

          <Label htmlFor="pe-excerpt" className="mt-4 block">Qısa təsvir <span className="font-normal text-navy-400">(siyahıda və paylaşımda görünür; boş qalsa mətnin əvvəlindən götürülür)</span></Label>
          <textarea id="pe-excerpt" value={f.excerpt} maxLength={300} rows={2} onChange={(e) => set("excerpt", e.target.value)} className={`${field} mt-2`} />
          {err(fields.excerpt)}
        </div>

        <div className={box}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy-50 pb-3">
            <div role="tablist" aria-label="Redaktor rejimi" className="flex gap-1 rounded-[12px] bg-navy-50 p-1">
              {([["write", "Yaz"], ["preview", "Önizləmə"]] as const).map(([k, l]) => (
                <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setTab(k)} className={`rounded-[9px] px-4 py-1.5 text-sm font-semibold transition-colors ${tab === k ? "bg-white text-navy-900 shadow-sm" : "text-navy-400 hover:text-navy-900"}`}>
                  {l}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-0.5" role="toolbar" aria-label="Formatlama" aria-hidden={tab === "preview"}>
              <button type="button" title="Böyük başlıq" aria-label="Böyük başlıq (H2)" className={toolbarBtn} disabled={tab === "preview"} onClick={() => linePrefix(() => "## ", "Bölmə başlığı")}><Heading2 className="h-4 w-4" /></button>
              <button type="button" title="Kiçik başlıq" aria-label="Kiçik başlıq (H3)" className={toolbarBtn} disabled={tab === "preview"} onClick={() => linePrefix(() => "### ", "Alt başlıq")}><Heading3 className="h-4 w-4" /></button>
              <button type="button" title="Qalın" aria-label="Qalın" className={toolbarBtn} disabled={tab === "preview"} onClick={() => wrap("**", "qalın mətn")}><Bold className="h-4 w-4" /></button>
              <button type="button" title="Maili" aria-label="Maili" className={toolbarBtn} disabled={tab === "preview"} onClick={() => wrap("*", "maili mətn")}><Italic className="h-4 w-4" /></button>
              <button type="button" title="Link" aria-label="Link əlavə et" className={toolbarBtn} disabled={tab === "preview"} onClick={link}><Link2 className="h-4 w-4" /></button>
              <button type="button" title="Siyahı" aria-label="Nişanlı siyahı" className={toolbarBtn} disabled={tab === "preview"} onClick={() => linePrefix(() => "- ", "siyahı bəndi")}><List className="h-4 w-4" /></button>
              <button type="button" title="Nömrəli siyahı" aria-label="Nömrəli siyahı" className={toolbarBtn} disabled={tab === "preview"} onClick={() => linePrefix((i) => `${i + 1}. `, "addım")}><ListOrdered className="h-4 w-4" /></button>
              <button type="button" title="Sitat" aria-label="Sitat" className={toolbarBtn} disabled={tab === "preview"} onClick={() => linePrefix(() => "> ", "sitat")}><Quote className="h-4 w-4" /></button>
              <button type="button" title="Kod" aria-label="Kod" className={toolbarBtn} disabled={tab === "preview"} onClick={() => edit((sel) => (sel.includes("\n") ? { text: `\n\`\`\`\n${sel}\n\`\`\`\n` } : { text: `\`${sel || "kod"}\``, select: [1, 1 + (sel || "kod").length] }))}><Code className="h-4 w-4" /></button>
              <button type="button" title="Ayırıcı xətt" aria-label="Ayırıcı xətt" className={toolbarBtn} disabled={tab === "preview"} onClick={() => edit(() => ({ text: "\n---\n" }))}><Minus className="h-4 w-4" /></button>
              <button type="button" title="Mətnin içinə şəkil" aria-label="Mətnin içinə şəkil əlavə et" className={toolbarBtn} disabled={tab === "preview" || busy === "upload"} onClick={() => bodyInput.current?.click()}><ImagePlus className="h-4 w-4" /></button>
              <input ref={bodyInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" aria-label="Mətnə şəkil yüklə" onChange={(e) => { void insertImage(e.target.files?.[0]); e.target.value = ""; }} />
            </div>
          </div>

          {tab === "write" ? (
            <>
              <label htmlFor="pe-content" className="sr-only">Məqalənin mətni</label>
              <textarea
                id="pe-content"
                ref={area}
                value={f.content}
                onChange={(e) => set("content", e.target.value)}
                rows={22}
                placeholder={"Məqalənizi yazın. Başlıq üçün ## və ### , qalın üçün **mətn**, siyahı üçün - istifadə edin.\n\nAlətlər panelindən formatlama və şəkil əlavə edə bilərsiniz."}
                className="mt-4 w-full resize-y rounded-xl border border-navy-100 bg-white px-4 py-3 font-mono text-[13.5px] leading-relaxed text-navy-900 focus:border-electric-500"
              />
              {err(fields.content)}
            </>
          ) : (
            <div className="mt-4 min-h-[20rem] rounded-xl bg-white">
              {f.content.trim() ? <BlogMarkdown source={f.content} /> : <p className="text-sm text-navy-400">Önizləmək üçün əvvəlcə mətn yazın.</p>}
            </div>
          )}
          <p className="mt-3 text-xs text-navy-400">{words} söz · təxminən {readingMinutes(f.content)} dəq oxu · Markdown dəstəklənir</p>
        </div>
      </div>

      <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start" aria-label="Yazı parametrləri">
        <div className={box}>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base text-navy-900">Dərc</h2>
            <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${status === "PUBLISHED" ? (scheduled ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700") : "bg-navy-50 text-navy-600"}`}>
              {status === "PUBLISHED" ? (scheduled ? "Planlanıb" : "Dərc olunub") : "Qaralama"}
            </span>
          </div>
          <Label htmlFor="pe-when" className="mt-4 block">Dərc tarixi <span className="font-normal text-navy-400">(boş = indi; gələcək tarix = planlama)</span></Label>
          <input id="pe-when" type="datetime-local" value={publishAt} onChange={(e) => { setPublishAt(e.target.value); setDirty(true); }} className={`${field} mt-2`} />
          {err(fields.publishedAt)}

          <ul className="mt-4 space-y-1.5 text-[13px]" aria-label="Dərc üçün hazırlıq">
            {checks.map((c) => (
              <li key={c.text} className={`flex items-start gap-2 ${c.ok ? "text-emerald-700" : "soft" in c ? "text-navy-400" : "text-red-600"}`}>
                <span aria-hidden className="mt-px font-bold">{c.ok ? "✓" : "•"}</span>
                <span>{c.text}<span className="sr-only">{c.ok ? " — hazırdır" : " — çatışmır"}</span></span>
              </li>
            ))}
          </ul>

          {msg && <p role={msg.kind === "error" ? "alert" : "status"} className={`mt-4 rounded-xl px-3 py-2 text-sm font-semibold ${msg.kind === "error" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}>{msg.text}</p>}
          <div className="mt-4 flex flex-col gap-2">
            <Button type="button" variant="app" size="md" disabled={busy !== null || !ready} onClick={() => save("PUBLISHED")}>
              {busy === "publish" ? "Gözləyin..." : status === "PUBLISHED" ? "Yenilə" : scheduled ? "Planlaşdır" : "Dərc et"}
            </Button>
            <Button type="button" variant="app-outline" size="md" disabled={busy !== null} onClick={() => save("DRAFT")}>
              {busy === "draft" ? "Saxlanılır..." : status === "PUBLISHED" ? "Qaralamaya qaytar" : "Qaralama kimi saxla"}
            </Button>
          </div>
          <p className="mt-3 text-xs text-navy-400">{dirty ? "Saxlanmamış dəyişikliklər var." : savedAt ? `Saxlanıldı: ${savedAt.toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" })}` : id ? "Bütün dəyişikliklər saxlanılıb." : "Hələ saxlanılmayıb."}</p>
          {id && status === "PUBLISHED" && !scheduled && (
            <p className="mt-2 text-xs"><Link href={`/bloq/${f.slug}`} target="_blank" className="font-semibold text-electric-600 hover:underline">Saytda aç →</Link></p>
          )}
          {id && (
            <button type="button" onClick={remove} disabled={busy !== null} className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:underline disabled:opacity-50">
              <Trash2 className="h-3.5 w-3.5" aria-hidden /> Yazını sil
            </button>
          )}
        </div>

        <div className={box}>
          <h2 className="font-display text-base text-navy-900">Qapaq şəkli</h2>
          {f.coverUrl ? (
            <div className="mt-3 space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.coverUrl} alt={f.coverAlt || "Qapaq şəkli"} className="aspect-[16/10] w-full rounded-xl object-cover" />
              <div className="flex gap-3 text-xs font-semibold">
                <button type="button" onClick={() => coverInput.current?.click()} className="text-electric-600 hover:underline">Dəyiş</button>
                <button type="button" onClick={() => set("coverUrl", null)} className="text-red-500 hover:underline">Sil</button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => coverInput.current?.click()} disabled={busy === "upload"} className="mt-3 flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-navy-100 text-sm text-navy-400 transition-colors hover:border-electric-500 hover:text-electric-600">
              <ImagePlus className="h-6 w-6" aria-hidden />
              {busy === "upload" ? "Yüklənir..." : "Şəkil seçin (PNG, JPG, WebP)"}
              <span className="text-xs">Tövsiyə: 1600×1000 piksel, 8 MB-a qədər</span>
            </button>
          )}
          <input ref={coverInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" aria-label="Qapaq şəkli yüklə" onChange={(e) => { void setCover(e.target.files?.[0]); e.target.value = ""; }} />
          {err(fields.coverUrl)}
          <Label htmlFor="pe-alt" className="mt-4 block">Şəklin təsviri (alt mətn)</Label>
          <Input id="pe-alt" value={f.coverAlt} maxLength={160} onChange={(e) => set("coverAlt", e.target.value)} placeholder="Şəkildə nə görünür?" className="mt-2" />
          {err(fields.coverAlt)}
        </div>

        <div className={box}>
          <h2 className="font-display text-base text-navy-900">Kateqoriya və etiketlər</h2>
          <Label htmlFor="pe-cat" className="mt-3 block">Kateqoriya</Label>
          <select id="pe-cat" value={f.category} onChange={(e) => set("category", e.target.value)} className={`${field} mt-2`}>
            {categoryLabels.map((c) => <option key={c}>{c}</option>)}
          </select>
          {err(fields.category)}
          <Label htmlFor="pe-tags" className="mt-4 block">Etiketlər <span className="font-normal text-navy-400">(Enter və ya vergül ilə, ən çox 8)</span></Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {f.tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 rounded-full bg-navy-50 px-3 py-1 text-xs font-semibold text-navy-600">
                #{t}
                <button type="button" aria-label={`${t} etiketini sil`} onClick={() => set("tags", f.tags.filter((x) => x !== t))} className="text-navy-400 hover:text-red-500">×</button>
              </span>
            ))}
          </div>
          <Input
            id="pe-tags"
            value={tagInput}
            disabled={f.tags.length >= 8}
            onChange={(e) => (e.target.value.includes(",") ? addTags(e.target.value) : setTagInput(e.target.value))}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTags(tagInput); } }}
            onBlur={() => tagInput && addTags(tagInput)}
            placeholder="məsələn: python, uşaqlar"
            className="mt-2"
          />
          {err(fields.tags)}
        </div>

        <div className={box}>
          <h2 className="font-display text-base text-navy-900">SEO (Google)</h2>
          <div className="mt-3 rounded-xl border border-navy-100 bg-white p-3" aria-label="Google-da necə görünəcək">
            <p className="truncate text-xs text-emerald-700">{host} › bloq › {slugPreview}</p>
            <p className="mt-0.5 line-clamp-2 text-[15px] font-medium text-[#1a0dab]">{snippetTitle.slice(0, 60)}{snippetTitle.length > 60 ? "…" : ""}</p>
            <p className="mt-0.5 line-clamp-2 text-xs text-navy-600">{snippetDesc.slice(0, 160)}</p>
          </div>
          <Label htmlFor="pe-slug" className="mt-4 block">Məqalə ünvanı</Label>
          <Input id="pe-slug" value={f.slug} maxLength={80} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value.toLowerCase()); }} placeholder="avtomatik yaranır" className="mt-2 font-mono text-[13px]" />
          {err(fields.slug)}
          {status === "PUBLISHED" && <p className="mt-1.5 text-xs text-amber-700">Dərc olunmuş yazının ünvanını dəyişsəniz köhnə link işləməyəcək.</p>}
          <Label htmlFor="pe-mt" className="mt-4 block">SEO başlığı <span className="font-normal text-navy-400">(boş = yazının başlığı)</span></Label>
          <Input id="pe-mt" value={f.metaTitle} maxLength={70} onChange={(e) => set("metaTitle", e.target.value)} className="mt-2" />
          <p className={`mt-1 text-right text-xs ${f.metaTitle.length > 60 ? "text-amber-700" : "text-navy-400"}`}>{f.metaTitle.length}/60 tövsiyə</p>
          {err(fields.metaTitle)}
          <Label htmlFor="pe-md" className="block">SEO təsviri <span className="font-normal text-navy-400">(boş = qısa təsvir)</span></Label>
          <textarea id="pe-md" value={f.metaDescription} maxLength={170} rows={3} onChange={(e) => set("metaDescription", e.target.value)} className={`${field} mt-2`} />
          <p className={`mt-1 text-right text-xs ${f.metaDescription.length > 160 ? "text-amber-700" : "text-navy-400"}`}>{f.metaDescription.length}/160 tövsiyə</p>
          {err(fields.metaDescription)}
        </div>
      </aside>
    </div>
  );
}
