/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router is now stable in Next.js 15, no need for experimental flag
  outputFileTracingRoot: process.cwd(),
}

module.exports = nextConfig
