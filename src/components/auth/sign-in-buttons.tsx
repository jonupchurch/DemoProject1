"use client";

import { signIn } from "next-auth/react";

export function SignInButtons() {
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/decisions" })}
        className="rounded-card bg-brand-500 px-6 py-3 font-medium text-white hover:bg-brand-600"
      >
        Continue with Google
      </button>
      <button
        type="button"
        onClick={() => signIn("github", { callbackUrl: "/decisions" })}
        className="rounded-card border border-gray-300 px-6 py-3 font-medium hover:border-brand-500"
      >
        Continue with GitHub
      </button>
    </div>
  );
}
