import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import authConfig from "@/auth.config";
import { seedStarterDecisions } from "@/lib/decision-seed";

// Node runtime only — the Prisma adapter can't run at the edge (see
// src/proxy.ts and plan.md Constraints). jwt session strategy is required
// alongside it: the edge proxy needs to verify a session without a database
// round trip (research.md §2).
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  callbacks: {
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  events: {
    // Fires exactly once, right when the adapter inserts a brand-new User
    // row — i.e. this person's very first sign-in ever, regardless of which
    // provider they used or how many providers they later link.
    async createUser({ user }) {
      if (user.id) {
        await seedStarterDecisions(user.id);
      }
    },
  },
});
