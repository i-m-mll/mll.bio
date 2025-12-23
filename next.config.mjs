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

  // ESLint and TypeScript checking enabled (don't ignore errors)
  // If build fails, fix the errors rather than suppressing them
}

export default nextConfig
