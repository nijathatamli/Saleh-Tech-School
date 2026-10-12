import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "PARENT" | "TEACHER" | "STUDENT" | "ADMIN";
    } & DefaultSession["user"];
  }

  interface User {
    role: "PARENT" | "TEACHER" | "STUDENT" | "ADMIN";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "PARENT" | "TEACHER" | "STUDENT" | "ADMIN";
    /** set when the account was deactivated/deleted after the cookie was issued */
    revoked?: boolean;
  }
}
