const nextConfig = {
  // Re-enable static exports
  output: 'export',
  
  // For static export, images need to be unoptimized
  images: {
    unoptimized: true,
  },
  
  // Enable React strict mode
  reactStrictMode: true,
  
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
