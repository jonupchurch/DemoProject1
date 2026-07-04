// `server-only` relies on a webpack/Turbopack resolve condition that only
// exists inside Next.js's actual build — under Vitest it would throw
// unconditionally. Tests already run in a Node/server-like context, so this
// stub is a safe no-op replacement (aliased in vitest.config.ts).
export {};
