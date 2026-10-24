import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

// Uploaded pictures are served from here (next.config.js rewrites /uploads/<name> to this route) because a production
// `next start` serves only the files that were in public/ when the server booted: a picture uploaded afterwards would be a 404.
const NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp)$/;
const TYPES: Record<string, string> = { png: "image/png", jpg: "image/jpeg", webp: "image/webp" };

export async function GET(_req: Request, { params }: { params: { name: string } }) {
  const m = NAME.exec(params.name);
  if (!m) return new Response("Not found", { status: 404 });
  try {
    const bytes = await readFile(path.join(process.cwd(), "public", "uploads", params.name));
    return new Response(new Uint8Array(bytes), {
      headers: { "Content-Type": TYPES[m[1]], "Cache-Control": "public, max-age=31536000, immutable", "Content-Length": String(bytes.length) },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
