import { MSG } from "@/lib/scholarship/config";
import { getExamState, startExam } from "@/lib/scholarship/exam";
import { fail, ok, route } from "@/lib/scholarship/http";
import { getSessionStudent } from "@/lib/scholarship/session";

export const dynamic = "force-dynamic";

export const POST = route(
  async () => {
    const s = await getSessionStudent();
    if (!s) return fail(401, MSG.sessionExpired);
    if ((await startExam(s.id, s.categoryKey)) === "no-questions") return fail(404, MSG.noQuestions);
    const state = await getExamState(s.id, s.categoryKey, s.categoryLabel, s.language);
    if (state.status === "NO_QUESTIONS") return fail(404, MSG.noQuestions);
    return ok(state);
  },
  { mutating: true },
);
