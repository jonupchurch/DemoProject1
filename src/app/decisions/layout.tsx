import { requireCurrentUserId } from "@/lib/session";
import { DecisionsSubnav } from "@/components/decisions/decisions-subnav";

// The actual enforcement point for constitution Principle III — proxy.ts
// gives a fast-path redirect, but CVE-2025-29927 means that alone isn't
// trustworthy (research.md §3). Every decision route renders under this
// layout, so this check runs before any child page touches decision data.
// The nav bar (with sign-out) now lives in the root layout.
export default async function DecisionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCurrentUserId();
  return (
    <>
      <DecisionsSubnav />
      {children}
    </>
  );
}
