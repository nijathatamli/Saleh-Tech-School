"use client";

/** Uploads one picture through /api/uploads; resolves with the public URL or an Azerbaijani error. */
export async function uploadImage(file: File): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (file.size > 8 * 1024 * 1024) return { ok: false, error: "Şəkil 8 MB-dan böyük ola bilməz." };
  const fd = new FormData();
  fd.append("file", file);
  try {
    const r = await fetch("/api/uploads", { method: "POST", body: fd });
    const j = await r.json().catch(() => ({}));
    if (r.ok && typeof j.url === "string") return { ok: true, url: j.url };
    if (r.status === 415) return { ok: false, error: "Yalnız PNG, JPG və ya WebP şəkli yükləmək olar." };
    if (r.status === 413) return { ok: false, error: "Şəkil 8 MB-dan böyük ola bilməz." };
    if (r.status === 429) return { ok: false, error: "Çox şəkil yükləndi. Bir az sonra yenidən cəhd edin." };
    return { ok: false, error: "Şəkil yüklənmədi. Yenidən cəhd edin." };
  } catch {
    return { ok: false, error: "Əlaqə qurulmadı. İnternet bağlantınızı yoxlayın." };
  }
}
