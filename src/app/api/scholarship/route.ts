import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SCHOLARSHIP_EXAM, SCHOLARSHIP_PASS_RATIO, generateApplicationCode } from "@/lib/scholarship-exam";

// scholarship.html is a standalone static file that may be opened straight
// from disk (file://) as well as served, so the API needs to be reachable
// cross-origin.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  const questions = SCHOLARSHIP_EXAM.map(({ id, section, text, options }) => ({ id, section, text, options }));
  return NextResponse.json({ questions, durationMinutes: 30 }, { headers: CORS_HEADERS });
}

type SubmitBody = {
  fullName?: unknown;
  email?: unknown;
  phone?: unknown;
  age?: unknown;
  answers?: unknown;
};

export async function POST(request: Request) {
  let body: SubmitBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: CORS_HEADERS });
  }

  const { fullName, email, phone, age, answers } = body;

  if (
    typeof fullName !== "string" ||
    !fullName.trim() ||
    typeof email !== "string" ||
    !email.trim() ||
    typeof phone !== "string" ||
    !phone.trim() ||
    typeof age !== "number" ||
    !Number.isFinite(age) ||
    typeof answers !== "object" ||
    answers === null
  ) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400, headers: CORS_HEADERS });
  }

  const answerMap = answers as Record<string, unknown>;

  let score = 0;
  for (const question of SCHOLARSHIP_EXAM) {
    if (answerMap[question.id] === question.correctIndex) score += 1;
  }

  const totalQuestions = SCHOLARSHIP_EXAM.length;
  const passed = score / totalQuestions >= SCHOLARSHIP_PASS_RATIO;
  const applicationCode = generateApplicationCode();

  const application = await prisma.scholarshipApplication.create({
    data: {
      applicationCode,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      age: Math.round(age),
      score,
      totalQuestions,
      passed,
      answers: answerMap,
    },
  });

  return NextResponse.json(
    {
      applicationCode: application.applicationCode,
      score,
      totalQuestions,
      passed,
    },
    { headers: CORS_HEADERS },
  );
}
