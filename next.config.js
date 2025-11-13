/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router is now stable and doesn't need experimental flag
  optimizeFonts: false, // Disable Google Fonts optimization for offline builds
}

module.exports = nextConfig