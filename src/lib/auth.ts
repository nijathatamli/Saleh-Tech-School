import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { AuthOptions, Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { ipFromHeader, loginBlockedFor, loginFailed, loginKeys, loginSucceeded } from "@/lib/rate-limit";

// Compared against when the account does not exist, so "unknown e-mail" costs as much time as "wrong password".
const DUMMY_HASH = bcrypt.hashSync(randomUUID(), 10);

// One account lookup per request: a page render calls getServerSession from the layout, the page and its helpers.
const accountOf = cache((id: string) => prisma.user.findUnique({ where: { id }, select: { active: true, role: true } }));

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/giris",
    error: "/giris",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;
        if (credentials.email.length > 254 || credentials.password.length > 200) return null;

        const email = credentials.email.toLowerCase();
        const keys = loginKeys(email, ipFromHeader((n) => req?.headers?.[n]));
        if (loginBlockedFor(keys)) return null; // too many failed attempts: refuse even a correct password for a while

        const user = await prisma.user.findUnique({ where: { email } });
        // deactivated accounts cannot sign in
        const valid = await bcrypt.compare(credentials.password, user && user.active ? user.passwordHash : DUMMY_HASH);
        if (!user || !user.active || !valid) {
          loginFailed(keys);
          return null;
        }
        loginSucceeded(keys);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.avatarUrl ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: "PARENT" | "TEACHER" | "STUDENT" | "ADMIN" | "BLOGGER" }).role;
        token.id = user.id;
        token.revoked = false;
        return token;
      }
      // Every later read re-checks the account: a deactivated or deleted user (or a changed role) takes effect
      // immediately instead of when the 30-day cookie expires.
      if (token.id) {
        const row = await accountOf(token.id);
        if (!row || !row.active) token.revoked = true;
        else {
          token.revoked = false;
          token.role = row.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.revoked || !token.id) return { expires: session.expires } as Session; // no `user` → every guard treats it as signed out
      if (session.user) {
        (session.user as { id?: string; role?: string }).id = token.id as string;
        (session.user as { id?: string; role?: string }).role = token.role as string;
      }
      return session;
    },
  },
};
