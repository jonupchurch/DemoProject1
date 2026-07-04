import { requireCurrentUserId } from "@/lib/session";
import { SignOutButton } from "@/components/auth/sign-out-button";

// The actual enforcement point for constitution Principle III — proxy.ts
// gives a fast-path redirect, but CVE-2025-29927 means that alone isn't
// trustworthy (research.md §3). Every decision route renders under this
// layout, so this check runs before any child page touches decision data.
export default async function DecisionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCurrentUserId();

  return (
    <div>
      <header className="flex items-center justify-end border-b border-gray-200 px-4 py-3">
        <SignOutButton />
      </header>
      {children}
    </div>
  );
}
