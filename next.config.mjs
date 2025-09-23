/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  
  // Performance optimizations
  experimental: {
    turbo: {
      memoryLimit: 512
    }
  },
  
  // Enable SWC minification for better performance
  swcMinify: true,
  
  // Optimize webpack for development
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.next', '**/dist']
      }
    }
    return config
  }
}

export default nextConfig
