import { z } from "zod";
import { fail, handle, ok, readJson } from "@/lib/api";
import { addView } from "@/lib/blog/posts";
import { ipFromHeader, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const body = z.object({ slug: z.string().trim().min(3).max(90).regex(/^[a-z0-9-]+$/) });

/** Counts one read of a published post. The page also remembers it per browser tab; this caps repeats per address. */
export const POST = handle(
  async (req) => {
    const { slug } = body.parse(await readJson(req));
    const ip = ipFromHeader((n) => req.headers.get(n));
    if (!rateLimit(`blogview:${ip}:${slug}`, 3, 60 * 60_000).ok) return ok({ counted: false });
    if (!rateLimit(`blogview-ip:${ip}`, 120, 60 * 60_000).ok) return fail(429, "Çox sorğu.");
    await addView(slug);
    return ok({ counted: true });
  },
  { mutating: true }
);
