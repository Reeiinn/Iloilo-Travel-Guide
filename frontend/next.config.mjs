import { fileURLToPath } from 'node:url'

// Repo root (one level up). The app imports code from ../backend, so Next needs
// to watch and trace files from the whole repo, not just frontend/.
const repoRoot = fileURLToPath(new URL('..', import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // backend/ ships TypeScript source, so Next compiles it along with the app
  transpilePackages: ['@ilocate/backend'],
  turbopack: {
    root: repoRoot,
  },
  outputFileTracingRoot: repoRoot,
  // Old landing/itinerary URLs now live inside the app
  async redirects() {
    return [
      { source: '/faqs', destination: '/dashboard/help', permanent: true },
      { source: '/dashboard/itinerary', destination: '/dashboard', permanent: true },
    ]
  },
  images: {
    unoptimized: true,
    qualities: [75, 90], // Added to support quality 90
  },
}

export default nextConfig
