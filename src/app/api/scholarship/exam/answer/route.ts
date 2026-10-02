import { MSG } from "@/lib/scholarship/config";
import { saveAnswer } from "@/lib/scholarship/exam";
import { fail, ok, readJson, route } from "@/lib/scholarship/http";
import { getSessionStudent } from "@/lib/scholarship/session";
import { answerSchema } from "@/lib/scholarship/validation";

export const dynamic = "force-dynamic";

// Autosave of a single answer while the exam is running.
export const PUT = route(
  async (req) => {
    const s = await getSessionStudent();
    if (!s) return fail(401, MSG.sessionExpired);
    const parsed = answerSchema.safeParse(await readJson(req));
    if (!parsed.success) return fail(400, MSG.badRequest);

    const r = await saveAnswer(s.id, parsed.data.questionId, parsed.data.answer);
    if (r.ok) return ok({ ok: true });
    switch (r.error) {
      case "not-started":
        return fail(409, MSG.examNotStarted);
      case "finished":
      case "expired":
        return fail(409, MSG.examFinished);
      default:
        return fail(400, MSG.badRequest);
    }
  },
  { mutating: true },
);
