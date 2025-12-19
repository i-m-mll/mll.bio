const nextConfig = {
  // Re-enable static exports
  output: 'export',

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
