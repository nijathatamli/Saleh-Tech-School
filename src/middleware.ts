import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";
import { adminPath } from "@/lib/admin-path";

const roleForPrefix: Record<string, string> = {
  "/parent": "PARENT",
  "/teacher": "TEACHER",
  "/student": "STUDENT",
  "/admin": "ADMIN",
  "/blogger": "BLOGGER",
};

const under = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(prefix + "/");

// Any path no route answers: rewriting there renders the normal 404 page with a 404 status.
const notFound = (req: NextRequest) => NextResponse.rewrite(new URL("/__yoxdur", req.url));

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const secret = adminPath();

  // The admin panel's front door: the sign-in page at /<ADMIN_PATH>; an admin who is already in goes straight to the panel.
  // With ADMIN_PATH set, /api/admin also answers 404 to everyone else.
  if (secret && pathname === `/${secret}`) {
    const token = await getToken({ req });
    if (token && !token.revoked && token.role === "ADMIN") return NextResponse.redirect(new URL("/admin", req.url));
    return NextResponse.rewrite(new URL("/giris", req.url));
  }

  if (under(pathname, "/api/admin")) {
    if (!secret) return NextResponse.next(); // the routes check the session themselves
    const token = await getToken({ req });
    if (token && !token.revoked && token.role === "ADMIN") return NextResponse.next();
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const prefix = Object.keys(roleForPrefix).find((p) => under(pathname, p));
  if (!prefix) return NextResponse.next();

  // A panel is only there for its own role: everyone else gets the plain 404, not a sign-in page that tells them it exists.
  const token = await getToken({ req });
  if (token && !token.revoked && token.role === roleForPrefix[prefix]) return NextResponse.next();
  return notFound(req);
}

export const config = {
  // every page (the admin front door can be any path), but not Next's assets or files with an extension
  matcher: ["/((?!_next/static|_next/image|.*\\.[a-zA-Z0-9]+$).*)"],
};
