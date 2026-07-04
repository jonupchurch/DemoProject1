import NextAuth from "next-auth";
import authConfig from "@/auth.config";

// Edge runtime — deliberately built from auth.config.ts alone (no Prisma
// adapter) so this can run without a database connection. This is a
// fast-path redirect only, NOT the actual enforcement point: CVE-2025-29927
// showed middleware/proxy-based auth checks are bypassable via a spoofed
// header, so every protected layout/page independently re-checks the
// session server-side too (src/lib/session.ts#requireCurrentUserId,
// src/app/decisions/layout.tsx). See plan.md Constraints and research.md §3.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = Boolean(req.auth);

  if (!isLoggedIn) {
    return Response.redirect(new URL("/", req.nextUrl));
  }
});

export const config = {
  // /travel, /travel/list, and /travel/[id] are deliberately NOT listed here
  // — they're public by design (FR-005); only publishing/editing a pin
  // requires auth.
  matcher: ["/decisions/:path*", "/contact", "/travel/new", "/travel/:id/edit"],
};
