const path = require('path')

const isWindows = process.platform === 'win32'
const windowsDistDir = 'build/.next-windows'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep Vercel/Unix builds on the default folder while avoiding Windows permission issues
  distDir: process.env.NEXT_DIST_DIR || (isWindows ? windowsDistDir : '.next'),
}

module.exports = nextConfig
