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

  // Next's internal build lint hook still passes legacy options that conflict
  // with this repo's flat ESLint config. The npm build script runs lint first.
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
