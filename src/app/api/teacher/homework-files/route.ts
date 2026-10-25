import { ApiError, MSG, fail, handle, ok, requireRole } from "@/lib/api";
import { MAX_FILE_BYTES, checkUpload, sweepOrphans } from "@/lib/homework-files";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** One file per request (multipart, field "file"). The file waits unattached until the homework form is submitted. */
export const POST = handle(
  async (req) => {
    const teacher = await requireRole("TEACHER");
    if (!rateLimit(`hwfile:${teacher.id}`, 60, 60 * 60_000).ok) return fail(429, "Çox fayl yükləndi. Bir az sonra yenidən cəhd edin.");
    const declared = Number(req.headers.get("content-length") ?? 0);
    if (declared > MAX_FILE_BYTES + 64 * 1024) return fail(413, "Fayl 10 MB-dan böyük ola bilməz.");
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      throw new ApiError(400, MSG.invalid);
    }
    const file = form.get("file");
    if (!(file instanceof File)) throw new ApiError(400, "Fayl seçilməyib.");
    if (file.size > MAX_FILE_BYTES) return fail(413, "Fayl 10 MB-dan böyük ola bilməz.");
    const bytes = Buffer.from(await file.arrayBuffer());
    const checked = checkUpload(file.name, bytes);
    if (!checked.ok) return fail(checked.status, checked.error);
    const pending = await prisma.homeworkFile.count({ where: { uploaderId: teacher.id, homeworkId: null } });
    if (pending >= 20) return fail(429, "Çoxlu istifadə olunmamış fayl var. Əvvəlcə tapşırığı yaradın və ya faylları silin.");
    const row = await prisma.homeworkFile.create({ data: { uploaderId: teacher.id, filename: checked.value.filename, mime: checked.value.mime, size: checked.value.size, data: bytes }, select: { id: true, filename: true, size: true } });
    void sweepOrphans().catch(() => {});
    return ok({ id: row.id, name: row.filename, size: row.size }, 201);
  },
  { mutating: true }
);
