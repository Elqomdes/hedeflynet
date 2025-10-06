/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  // Disable caching for development
  ...(process.env.NODE_ENV === 'development' && {
    onDemandEntries: {
      maxInactiveAge: 25 * 1000,
      pagesBufferLength: 2,
    },
  }),
  // Cache control headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
  redirects: async () => {
    return [
      { source: '/ogretmen/adaptif-%C3%B6%C4%9Frenme', destination: '/ogretmen/adaptif-ogrenme', permanent: true },
      { source: '/ogretmen/sosyal-%C3%B6%C4%9Frenme', destination: '/ogretmen/sosyal-ogrenme', permanent: true },
    ];
  },
  experimental: {
    serverComponentsExternalPackages: ['mongoose'],
    optimizePackageImports: ['lucide-react'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('mongoose');
    }
    
    // Optimize bundle size
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    };
    
    return config;
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  httpAgentOptions: {
    keepAlive: true,
  },
  // Performance optimizations
  swcMinify: true,
  reactStrictMode: true,
  // Enable static optimization where possible
  trailingSlash: false,
  // Optimize fonts
  optimizeFonts: true,
}

module.exports = nextConfig
