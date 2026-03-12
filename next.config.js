const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
  },
  // Enable React Strict Mode
  reactStrictMode: true,
  // Enable production browser source maps
  productionBrowserSourceMaps: false, // Enable if needed for debugging
  // Configure webpack
  webpack: (config, { isServer, dev, webpack }) => {
    // Only add source maps in development
    if (!dev) {
      config.devtool = 'source-map';
    }

    // Add fallbacks for Node.js built-ins
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
      };
    }

    // Important: return the modified config
    return config;
  },
  // Enable modularize imports for better tree-shaking
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{ kebabCase member }}',
    },
  },
  // Configure output file tracing
  output: 'standalone',
  experimental: {
    // Enable automatic CSS optimization
    optimizeCss: true,
    // Enable modular CSS for better CSS optimization
    modularizeCss: true,
    // Enable server components external packages
    serverComponentsExternalPackages: [
      '@stacks/connect',
      '@stacks/network',
      '@stacks/transactions',
    ],
    // Optimize package imports for better tree-shaking
    optimizePackageImports: ['lucide-react', 'date-fns', 'zustand'],
  },
};

module.exports = withBundleAnalyzer(nextConfig);
