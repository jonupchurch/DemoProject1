import "server-only";
import { prisma } from "@/lib/db";

// Stand-in for the account system phase 2 introduces (research.md §5).
// Exactly one Owner row exists in this phase; every Server Action and
// data-access function scopes its queries through this id. Phase 2 replaces
// this lookup with the authenticated session's user id — no schema or query
// changes are needed at that point.
let cachedOwnerId: string | undefined;

export async function getCurrentOwnerId(): Promise<string> {
  if (cachedOwnerId) {
    return cachedOwnerId;
  }

  const owner = await prisma.owner.findFirst();
  if (!owner) {
    throw new Error(
      "No Owner row found. Run `npm run prisma:seed` to seed the placeholder owner.",
    );
  }

  cachedOwnerId = owner.id;
  return cachedOwnerId;
}
