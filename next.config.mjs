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
  
  // Netlify-specific configuration
  output: 'standalone',
  
  // Add environment variable defaults for build
  env: {
    SKIP_ENV_VALIDATION: process.env.SKIP_ENV_VALIDATION || '1',
  },
  
  // Performance optimizations
  experimental: {
    turbo: {
      memoryLimit: 512
    }
  },
  
  // Enable SWC minification for better performance
  swcMinify: true,
  
  // Optimize webpack for development and production
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.next', '**/dist']
      }
    }
    
    // Netlify-specific optimizations
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    return config
  }
}

export default nextConfig
