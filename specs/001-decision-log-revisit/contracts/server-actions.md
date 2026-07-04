# Phase 1 Contracts: Server Actions

This project has no external API consumers in this phase (see research.md §3), so the "contract"
here is internal: the function signatures that `src/actions/decisions.ts` exposes to the UI layer.
Documented so `/speckit-tasks` and implementation agree on shape without re-deriving it from the
data model each time.

All actions operate implicitly on the current owner (`lib/owner.ts#getCurrentOwnerId()`) — no
`ownerId` parameter is accepted from the client.

## `createDecision(input: CreateDecisionInput): Promise<Decision>`

```text
CreateDecisionInput = {
  title: string
  options: { name: string, pros?: string, cons?: string }[]   // length >= 1 (FR-002)
  cost?: number
  risks?: string
  notes?: string
  confidence: number        // 0-100 (FR-013)
  category: Category        // enum
  reviewDate: string         // ISO date
}
```

- Rejects with a field-level validation error if `title`, `options` (min length 1, each with a
  non-empty `name`), `confidence` (0-100), `category`, or `reviewDate` are missing/invalid (FR-002,
  FR-013).
- On success, persists a `Decision` with `status = Pending` (FR-003) and returns it with its
  `Option`s attached.

## `updateDecision(id: string, input: CreateDecisionInput): Promise<Decision>`

- Same input shape and validation as `createDecision`.
- Rejects if the target `Decision` is not `Pending` (FR-009 — resolved decisions' original entry is
  locked).
- Replaces the decision's fields and its `Option` set (add/remove/edit options), enforcing at least
  one `Option` remains (FR-016, edge case).

## `deleteDecision(id: string): Promise<void>`

- Deletes a `Decision` (and its `Option`s/`Resolution`, if any) regardless of status (FR-012).
- The UI is responsible for confirming with the user before calling this action (spec Assumptions —
  hard delete, no undo).

## `resolveDecision(id: string, input: ResolveInput): Promise<Decision>`

```text
ResolveInput = {
  verdict: "Right" | "Wrong" | "Mixed"
  satisfaction: number       // 1-5 (FR-014)
  learnings?: string
}
```

- Rejects if the target `Decision` is not currently `Pending` (routes the caller to
  `updateResolution` instead — edge case, spec).
- Rejects with a field-level validation error if `verdict` or `satisfaction` (1-5) are missing/invalid
  (FR-007, FR-014).
- On success, creates the `Resolution`, sets the `Decision`'s `status = Resolved` (FR-008), and
  locks the original entry (FR-009).

## `updateResolution(decisionId: string, input: ResolveInput): Promise<Decision>`

- Same input shape and validation as `resolveDecision`.
- Rejects if the target `Decision` has no existing `Resolution` (i.e., is still `Pending` — use
  `resolveDecision` instead).
- Updates the existing `Resolution`'s fields only; does not touch the `Decision`'s locked original
  entry (FR-010).

## Read paths (no Server Actions — called directly from Server Components)

- `listDecisions(): Promise<Decision[]>` — all decisions for the current owner, both statuses
  (FR-004), ordered so decisions with an arrived/passed `reviewDate` and `status = Pending` are
  easy to identify (FR-006).
- `getDecision(id: string): Promise<Decision | null>` — full detail for one decision, including its
  `Resolution` if resolved (FR-005).
