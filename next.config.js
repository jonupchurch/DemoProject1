/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
  // Prisma 7's generated client + the `pg` driver adapter don't bundle
  // cleanly under Turbopack; treat them as server-external instead.
  serverExternalPackages: ["@prisma/client", "pg"],
};

export default nextConfig;
