import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const roleForPrefix: Record<string, string> = {
  "/parent": "PARENT",
  "/teacher": "TEACHER",
  "/student": "STUDENT",
  "/admin": "ADMIN",
  "/blogger": "BLOGGER",
};

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    const prefix = Object.keys(roleForPrefix).find((p) => pathname.startsWith(p));
    if (prefix && (token?.revoked || token?.role !== roleForPrefix[prefix])) {
      return NextResponse.redirect(new URL("/giris", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token && !token.revoked,
    },
    pages: {
      signIn: "/giris",
    },
  }
);

export const config = {
  matcher: ["/parent/:path*", "/teacher/:path*", "/student/:path*", "/admin/:path*", "/blogger/:path*"],
};
