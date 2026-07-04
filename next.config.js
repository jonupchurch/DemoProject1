/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
  // Prisma 7's generated client + the `pg` driver adapter don't bundle
  // cleanly under Turbopack; treat them as server-external instead.
  serverExternalPackages: ["@prisma/client", "pg"],
  // Next's own Server Action body parser defaults to 1MB — createPin/
  // addPhotoToPin pass real photo files (up to 10MB each, research.md §3)
  // straight through as action arguments, so this must be raised well past
  // that per-file cap to fit a multi-photo gallery in one request.
  experimental: {
    serverActions: {
      bodySizeLimit: "40mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      // Production PhotoStorage driver (research.md §2) — dev/test photos
      // are served same-origin via /api/travel-photos/*, no pattern needed.
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
