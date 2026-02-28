// Check if diff/edit mode is enabled (disables static export for dynamic features)
const enableDiff = process.env.ENABLE_DIFF === 'true' || process.env.ENABLE_EDIT === 'true'

const nextConfig = {
  // Static exports for production, but allow dynamic rendering in diff mode
  ...(enableDiff ? {} : { output: 'export' }),

  // For static export, images need to be unoptimized
  images: {
    unoptimized: true,
  },

  // Enable React strict mode
  reactStrictMode: true,

  // ESLint: disable during builds due to Next.js 15 / ESLint 8 API incompatibility
  // (useEslintrc + extensions removed in ESLint 9; run `npm run lint` locally instead)
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
