import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { MSG, SESSION_MAX_AGE_SECONDS } from "@/lib/scholarship/config";
import { fail, ok, readJson, route } from "@/lib/scholarship/http";
import { SESSION_COOKIE, clientIp, cookieOptions, createSessionToken, encryptFin, hashFin, rateLimit } from "@/lib/scholarship/security";
import { fieldErrors, registerSchema } from "@/lib/scholarship/validation";

export const dynamic = "force-dynamic";

// Registration is the only way in: there is no separate login. A valid, unused 32-character
// course code proves the candidate belongs to the course; on success the response sets the
// exam session cookie and the browser goes straight to the exam.
export const POST = route(
  async (req) => {
    const ip = clientIp(req);
    // generous, because a whole class may register from one school network
    const limit = rateLimit(`register:${ip}`, 200, 60 * 60_000);
    if (!limit.ok) return fail(429, MSG.tooMany, { retryAfter: limit.retryAfter });

    const body = await readJson(req);
    if (body === undefined || typeof body !== "object" || body === null) return fail(400, MSG.badRequest);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const fields = fieldErrors(parsed.error);
      const missing = Object.values(fields).some((m) => m === MSG.required);
      return fail(400, missing ? MSG.required : Object.values(fields)[0], { fields });
    }
    const { name, surname, category, fin, phone, email, code, language } = parsed.data;

    // guessing codes is the one thing worth throttling hard
    const guesses = rateLimit(`code:${ip}`, 12, 10 * 60_000);
    const codeRow = await prisma.scholarshipCode.findUnique({ where: { code }, select: { id: true, usedAt: true, studentId: true } });
    if (!codeRow) {
      if (!guesses.ok) return fail(429, MSG.tooMany, { retryAfter: guesses.retryAfter });
      return fail(400, MSG.codeInvalid, { fields: { code: MSG.codeInvalid } });
    }

    const cat = await prisma.scholarshipCategory.findUnique({ where: { key: category }, select: { key: true } });
    if (!cat) return fail(400, MSG.badCategory, { fields: { category: MSG.badCategory } });

    const finHash = hashFin(fin);
    const existing = await prisma.scholarshipStudent.findUnique({ where: { finHash }, select: { id: true } });

    let studentId: string;
    if (codeRow.usedAt) {
      // Same code + same FIN = the same candidate coming back (lost cookie, new device) — resume.
      if (existing && codeRow.studentId === existing.id) {
        studentId = existing.id;
        // the form was filled in again: keep the latest details, unless the exam is already finished
        const done = await prisma.scholarshipAttempt.findFirst({ where: { studentId, status: "SUBMITTED" }, select: { id: true } });
        if (!done) await prisma.scholarshipStudent.update({ where: { id: studentId }, data: { name, surname, phone, email, language } });
      } else return fail(409, MSG.codeUsed, { fields: { code: MSG.codeUsed } });
    } else {
      if (existing) return fail(409, MSG.finTaken, { fields: { fin: MSG.finTaken } });
      try {
        studentId = await prisma.$transaction(async (tx) => {
          // claim the code first: of two simultaneous registrations only one wins
          const claimed = await tx.scholarshipCode.updateMany({ where: { id: codeRow.id, usedAt: null }, data: { usedAt: new Date() } });
          if (claimed.count === 0) throw new Error("CODE_USED");
          const student = await tx.scholarshipStudent.create({
            data: { name, surname, phone, email, language, categoryKey: cat.key, finHash, finEncrypted: encryptFin(fin) },
            select: { id: true },
          });
          await tx.scholarshipCode.update({ where: { id: codeRow.id }, data: { studentId: student.id } });
          return student.id;
        });
      } catch (e) {
        if (e instanceof Error && e.message === "CODE_USED") return fail(409, MSG.codeUsed, { fields: { code: MSG.codeUsed } });
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          return fail(409, MSG.finTaken, { fields: { fin: MSG.finTaken } });
        }
        throw e;
      }
    }

    const res = ok({ ok: true }, 201);
    res.cookies.set(SESSION_COOKIE, await createSessionToken(studentId), { ...cookieOptions, maxAge: SESSION_MAX_AGE_SECONDS });
    return res;
  },
  { mutating: true },
);
