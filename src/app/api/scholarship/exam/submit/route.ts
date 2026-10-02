import { MSG } from "@/lib/scholarship/config";
import { submitExam } from "@/lib/scholarship/exam";
import { fail, ok, readJson, route } from "@/lib/scholarship/http";
import { getSessionStudent } from "@/lib/scholarship/session";
import { submitSchema } from "@/lib/scholarship/validation";

export const dynamic = "force-dynamic";

// Closes the attempt: the server (not the browser) grades the answers and stores the result.
export const POST = route(
  async (req) => {
    const s = await getSessionStudent();
    if (!s) return fail(401, MSG.sessionExpired);
    const body = (await readJson(req)) ?? {};
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) return fail(400, MSG.badRequest);

    const r = await submitExam(s.id, parsed.data.answers);
    if (!r.ok) return fail(r.error === "not-started" ? 409 : 400, r.error === "not-started" ? MSG.examNotStarted : MSG.badRequest);
    return ok({ status: "SUBMITTED" }); // the mark itself is for the admin panel only
  },
  { mutating: true },
);
