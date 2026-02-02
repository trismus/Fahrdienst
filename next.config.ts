import type { NextConfig } from "next";

/**
 * Build Content Security Policy directives.
 * Separate function for readability and testing.
 */
function buildCspDirectives(isDev: boolean): string {
  const directives: string[] = [
    // Default fallback - only allow same origin
    "default-src 'self'",

    // Scripts: self, inline (needed for Next.js), and Google Maps
    // Note: 'unsafe-inline' and 'unsafe-eval' are required for Next.js hydration
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://maps.gstatic.com",

    // Styles: self, inline (for Tailwind), and Google Fonts
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

    // Fonts: self and Google Fonts
    "font-src 'self' https://fonts.gstatic.com",

    // Images: self, data URIs (for inline images), HTTPS, and blob (for dynamic images)
    "img-src 'self' data: https: blob:",

    // Connect: self, Supabase (REST and WebSocket), and Google Maps
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://maps.googleapis.com",

    // Frames: none (prevents clickjacking)
    "frame-src 'none'",

    // Objects: none (prevents Flash/plugins)
    "object-src 'none'",

    // Base URI: self (prevents base tag hijacking)
    "base-uri 'self'",

    // Form actions: self (prevents form hijacking)
    "form-action 'self'",

    // Frame ancestors: self (alternative to X-Frame-Options)
    "frame-ancestors 'self'",

    // Upgrade insecure requests in production
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ];

  // Development: allow local connections
  if (isDev) {
    // Allow WebSocket and HTTP for local dev server
    directives.push(
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://maps.googleapis.com ws://localhost:* http://localhost:*"
    );
  }

  return directives.join('; ');
}

const nextConfig: NextConfig = {
  // Enable strict mode for better development experience
  reactStrictMode: true,

  // Production optimizations
  poweredByHeader: false, // Remove X-Powered-By header for security

  // Security headers
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    const csp = buildCspDirectives(isDev);

    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          // Content Security Policy - primary XSS protection
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
          // DNS prefetch for performance
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Control referrer information
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Disable certain browser features
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
          // HSTS - force HTTPS (only in production)
          ...(isDev
            ? []
            : [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=31536000; includeSubDomains',
                },
              ]),
        ],
      },
      {
        // Legacy XSS protection for older browsers (non-API routes)
        source: '/((?!api/).*)',
        headers: [
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  // Logging configuration
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },

  // Image optimization (allow Supabase storage)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },

  // Experimental features for better performance
  experimental: {
    // Enable server actions (already stable in Next.js 14+)
    // Optimize package imports for faster builds
    optimizePackageImports: ['@supabase/supabase-js', 'zod'],
  },
};

export default nextConfig;
