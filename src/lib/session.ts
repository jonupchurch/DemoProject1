import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** Replaces phase 1's getCurrentOwnerId() (research.md §3/§5). */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/**
 * The actual enforcement point for constitution Principle III — proxy.ts
 * gives a fast-path redirect, but CVE-2025-29927 means that alone isn't
 * trustworthy. Every protected layout/page calls this before touching data.
 */
export async function requireCurrentUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect("/");
  }
  return userId;
}
