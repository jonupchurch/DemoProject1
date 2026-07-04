"use client";

import { signIn } from "next-auth/react";
import { usePathname } from "next/navigation";

// Signing in no longer redirects to /decisions — with sign-in reachable from
// a popover on any page, the user should land back where they were, not get
// yanked somewhere else.
export function SignInButtons() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: pathname })}
        className="rounded-card bg-brand-500 px-6 py-3 font-medium text-white hover:bg-brand-600"
      >
        Continue with Google
      </button>
      <button
        type="button"
        onClick={() => signIn("github", { callbackUrl: pathname })}
        className="rounded-card border border-gray-300 bg-white px-6 py-3 font-medium text-gray-900 hover:border-brand-500"
      >
        Continue with GitHub
      </button>
    </div>
  );
}
