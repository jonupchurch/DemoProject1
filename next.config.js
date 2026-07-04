/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
  // Prisma 7's generated client + the `pg` driver adapter don't bundle
  // cleanly under Turbopack; treat them as server-external instead.
  serverExternalPackages: ["@prisma/client", "pg"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
};

export default nextConfig;
