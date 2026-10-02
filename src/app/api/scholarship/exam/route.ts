import { MSG } from "@/lib/scholarship/config";
import { getExamState } from "@/lib/scholarship/exam";
import { fail, ok, route } from "@/lib/scholarship/http";
import { getSessionStudent } from "@/lib/scholarship/session";

export const dynamic = "force-dynamic";

// The exam for the authenticated candidate's registered class — never anyone else's.
// Correct answers are never part of this payload.
export const GET = route(async () => {
  const s = await getSessionStudent();
  if (!s) return fail(401, MSG.sessionExpired);
  const state = await getExamState(s.id, s.categoryKey, s.categoryLabel, s.language);
  if (state.status === "NO_QUESTIONS") return fail(404, MSG.noQuestions);
  return ok(state);
});
