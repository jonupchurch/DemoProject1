import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { verifiedEmailOrNull } from "@/lib/auth-linking";
import { getVerifiedGithubEmail } from "@/lib/github-email";

// Edge-safe: no Prisma import here. Imported by both src/auth.ts (Node
// runtime, adds the adapter) and src/proxy.ts (edge runtime) — see plan.md
// Constraints for why this split is structurally required, not a choice.
export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Safe here specifically because profile() below only ever passes
      // through a verified email — see research.md §5.
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        const email = verifiedEmailOrNull(profile.email, profile.email_verified);
        return {
          id: profile.sub,
          name: profile.name,
          email,
          emailVerified: email ? new Date() : null,
          image: profile.picture,
        };
      },
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: { params: { scope: "read:user user:email" } },
      allowDangerousEmailAccountLinking: true,
      async profile(profile, tokens) {
        const email = await getVerifiedGithubEmail(tokens.access_token!);
        return {
          id: profile.id.toString(),
          name: profile.name ?? profile.login,
          email,
          emailVerified: email ? new Date() : null,
          image: profile.avatar_url,
        };
      },
    }),
  ],
  pages: {
    signIn: "/",
  },
} satisfies NextAuthConfig;
