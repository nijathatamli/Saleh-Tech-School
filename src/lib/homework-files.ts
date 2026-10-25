// Files a teacher attaches to a homework: what may be uploaded, how a file is checked, and who may download it.
// The type is decided from the file's name AND its first bytes (the type a browser declares is attacker-controlled),
// and a download is always sent as an attachment with a fixed content type, so an uploaded file can never run as a page.
import { AccessError } from "@/lib/access";
import { prisma } from "@/lib/prisma";

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB each
export { HW_MAX_FILES as MAX_FILES_PER_HOMEWORK } from "@/lib/homework-file-types";
import { HW_MAX_FILES } from "@/lib/homework-file-types";

type Kind = "pdf" | "zip" | "ole" | "png" | "jpg" | "webp" | "text";
const TYPES: Record<string, { mime: string; kind: Kind }> = {
  pdf: { mime: "application/pdf", kind: "pdf" },
  docx: { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", kind: "zip" },
  pptx: { mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", kind: "zip" },
  xlsx: { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", kind: "zip" },
  odt: { mime: "application/vnd.oasis.opendocument.text", kind: "zip" },
  doc: { mime: "application/msword", kind: "ole" },
  ppt: { mime: "application/vnd.ms-powerpoint", kind: "ole" },
  xls: { mime: "application/vnd.ms-excel", kind: "ole" },
  zip: { mime: "application/zip", kind: "zip" },
  sb3: { mime: "application/x-scratch3", kind: "zip" }, // Scratch projects
  png: { mime: "image/png", kind: "png" },
  jpg: { mime: "image/jpeg", kind: "jpg" },
  jpeg: { mime: "image/jpeg", kind: "jpg" },
  webp: { mime: "image/webp", kind: "webp" },
  txt: { mime: "text/plain; charset=utf-8", kind: "text" },
  csv: { mime: "text/csv; charset=utf-8", kind: "text" },
  md: { mime: "text/plain; charset=utf-8", kind: "text" },
  py: { mime: "text/plain; charset=utf-8", kind: "text" },
  ino: { mime: "text/plain; charset=utf-8", kind: "text" },
  java: { mime: "text/plain; charset=utf-8", kind: "text" },
  c: { mime: "text/plain; charset=utf-8", kind: "text" },
  cpp: { mime: "text/plain; charset=utf-8", kind: "text" },
  json: { mime: "text/plain; charset=utf-8", kind: "text" },
};

export const ALLOWED_EXTENSIONS = Object.keys(TYPES);
/** the value for <input type="file" accept="…"> */
export const ACCEPT = ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(",");

const startsWith = (b: Buffer, bytes: number[]) => b.length >= bytes.length && bytes.every((x, i) => b[i] === x);

function matchesKind(b: Buffer, kind: Kind): boolean {
  switch (kind) {
    case "pdf": return b.subarray(0, 1024).includes("%PDF-");
    case "zip": return startsWith(b, [0x50, 0x4b, 0x03, 0x04]) || startsWith(b, [0x50, 0x4b, 0x05, 0x06]);
    case "ole": return startsWith(b, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    case "png": return startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "jpg": return startsWith(b, [0xff, 0xd8, 0xff]);
    case "webp": return b.length >= 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP";
    case "text": return b.length === 0 || !b.subarray(0, 8192).includes(0); // no NUL byte: it is text, not a program
  }
}

export type Checked = { filename: string; mime: string; size: number };

/** Safe display name (no path, no control characters, at most 120 chars, extension kept) plus the verified type; or an Azerbaijani error. */
export function checkUpload(rawName: string, bytes: Buffer): { ok: true; value: Checked } | { ok: false; status: 413 | 415 | 400; error: string } {
  const base = rawName.replace(/\\/g, "/").split("/").pop() ?? "";
  const clean = base.replace(/[\u0000-\u001f\u007f<>:"|?*]/g, "").replace(/\s+/g, " ").trim();
  const dot = clean.lastIndexOf(".");
  const ext = dot > 0 ? clean.slice(dot + 1).toLowerCase() : "";
  if (!clean || dot <= 0) return { ok: false, status: 400, error: "Faylın adı və tipi (məs. tapsiriq.pdf) olmalıdır." };
  if (bytes.length === 0) return { ok: false, status: 400, error: "Fayl boşdur." };
  if (bytes.length > MAX_FILE_BYTES) return { ok: false, status: 413, error: "Fayl 10 MB-dan böyük ola bilməz." };
  const t = TYPES[ext];
  if (!t) return { ok: false, status: 415, error: "Bu fayl tipi dəstəklənmir. İcazə verilənlər: PDF, Word, PowerPoint, Excel, ZIP, şəkil (PNG/JPG/WebP), mətn və kod faylları (txt, csv, py, ino ...)." };
  if (!matchesKind(bytes, t.kind)) return { ok: false, status: 415, error: `Faylın məzmunu “.${ext}” tipinə uyğun deyil.` };
  const name = clean.length > 120 ? `${clean.slice(0, 120 - ext.length - 1).replace(/\.+$/, "")}.${ext}` : clean;
  return { ok: true, value: { filename: name, mime: t.mime, size: bytes.length } };
}

export const isInline = (mime: string) => mime.startsWith("image/");

/** RFC 5987 header: works for names with ə, ş, ğ … and cannot break out of the header. */
export function contentDisposition(filename: string, inline: boolean) {
  const ascii = filename.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `${inline ? "inline" : "attachment"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)}`;
}

export { formatSize } from "@/lib/file-size";

/** Who may download a file: the admin; the teacher of the homework's class (or, before it is attached, the uploader);
 *  a student who has a submission for it; a parent of such a student. Anyone else gets "not found". */
export async function canDownload(user: { id: string; role: string }, file: { homeworkId: string | null; uploaderId: string }): Promise<boolean> {
  if (user.role === "ADMIN") return true;
  if (user.role === "TEACHER") {
    if (file.uploaderId === user.id) return true;
    if (!file.homeworkId) return false;
    return !!(await prisma.homework.findFirst({ where: { id: file.homeworkId, lesson: { class: { teacher: { userId: user.id } } } }, select: { id: true } }));
  }
  if (!file.homeworkId) return false;
  if (user.role === "STUDENT") return !!(await prisma.submission.findFirst({ where: { homeworkId: file.homeworkId, student: { userId: user.id } }, select: { id: true } }));
  if (user.role === "PARENT") return !!(await prisma.submission.findFirst({ where: { homeworkId: file.homeworkId, student: { parent: { userId: user.id } } }, select: { id: true } }));
  return false;
}

/** Links previously uploaded (unattached, own) files to a homework inside the creating transaction. */
export async function attachFiles(tx: Pick<typeof prisma, "homeworkFile">, userId: string, homeworkId: string, ids: string[]) {
  if (!ids.length) return;
  if (ids.length > HW_MAX_FILES) throw new AccessError("forbidden", "too many files");
  const unique = Array.from(new Set(ids));
  const r = await tx.homeworkFile.updateMany({ where: { id: { in: unique }, uploaderId: userId, homeworkId: null }, data: { homeworkId } });
  if (r.count !== unique.length) throw new AccessError("forbidden", "a file is not yours or is already attached");
}

/** Uploaded but never attached (the form was abandoned): removed after a day. */
export const sweepOrphans = () => prisma.homeworkFile.deleteMany({ where: { homeworkId: null, createdAt: { lt: new Date(Date.now() - 24 * 3600_000) } } });
