import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          // Performance headers
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
          // Early Hints for HTTP/2 Push
          {
            key: 'Link',
            value: '</quid.webp>; rel=preload; as=image, </snitch.webp>; rel=preload; as=image'
          },
        ]
      },
      // Static assets aggressive caching
      {
        source: '/public/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      // Images caching
      {
        source: '/:all*.webp',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/:all*.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      // JavaScript bundles caching
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  },
  
  // Production optimizations
  compiler: {
    // Automatically remove console.log, console.info, console.debug in production
    // Keeps console.error and console.warn for debugging production issues
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
    // Remove React properties for smaller bundle
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },
  
  // Performance
  poweredByHeader: false,
  compress: true,
  
  // Aggressive code splitting
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js', '@supabase/ssr', 'react', 'react-dom'],
  },
  
  // Turbopack configuration (required for Next.js 16+)
  turbopack: {},
  
  // Webpack optimization for tree shaking
  webpack: (config, { dev, isServer }) => {
    if (!dev) {
      // Production optimizations
      config.optimization = {
        ...config.optimization,
        // Enable tree shaking
        usedExports: true,
        // Remove dead code
        minimize: true,
        // Split runtime code for better caching
        runtimeChunk: 'single',
        // Split vendor chunks
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Supabase bundle (changes less frequently)
            supabase: {
              test: /[\\/]node_modules[\\/](@supabase)[\\/]/,
              name: 'supabase',
              priority: 20,
              reuseExistingChunk: true,
            },
            // React bundle (changes less frequently)
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react',
              priority: 20,
              reuseExistingChunk: true,
            },
            // Other vendor code
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendor',
              priority: 10,
              reuseExistingChunk: true,
            },
            // Common code shared across pages
            common: {
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      };
      
      // Resolve optimizations
      config.resolve = {
        ...config.resolve,
        // Prioritize ES modules for tree shaking
        mainFields: ['module', 'main'],
        // Alias for smaller bundles
        alias: {
          ...config.resolve.alias,
          // Use production builds
          'react': 'react/cjs/react.production.min.js',
          'react-dom': 'react-dom/cjs/react-dom.production.min.js',
        },
      };
    }
    
    return config;
  },
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
