import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Liveness + database readiness for the hosting platform's health check and uptime monitors.
// Public on purpose and deliberately boring: no versions, no configuration, no error details.
export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    await Promise.race([prisma.$queryRaw`SELECT 1`, new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000))]);
    return NextResponse.json({ status: "ok" }, { headers });
  } catch (e) {
    console.error("[health] database check failed", e instanceof Error ? e.message : e);
    return NextResponse.json({ status: "degraded" }, { status: 503, headers });
  }
}
