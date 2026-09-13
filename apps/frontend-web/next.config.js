/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  transpilePackages: [
    '@imana-signature/shared-types',
    '@imana-signature/utils',
  ],
  async rewrites() {
    const apiGatewayUrl =
      process.env.API_GATEWAY_URL || 'http://localhost:3001';
    const commerceApiUrl = process.env.COMMERCE_API_URL || 'http://localhost:8080';

    return {
      // Historical URLs resolve to the same React/TypeScript pages.
      beforeFiles: [
        { source: '/index.html', destination: '/' },
        { source: '/la-maison.html', destination: '/about' },
        { source: '/magazine.html', destination: '/blog' },
        { source: '/catalogue.html', destination: '/collections' },
        { source: '/la-maison', destination: '/about' },
        { source: '/magazine', destination: '/blog' },
        { source: '/catalogue', destination: '/collections' },
      ],
      afterFiles: [
        { source: '/api/auth/:path*', destination: `${commerceApiUrl}/api/auth/:path*` },
        { source: '/api/newsletter', destination: `${commerceApiUrl}/api/newsletter` },
        { source: '/api/orders/status', destination: `${commerceApiUrl}/api/orders/status` },
        {
          source: '/api/:path*',
          destination: `${apiGatewayUrl}/api/:path*`,
        },
      ],
      fallback: [],
    };
  },
};

module.exports = nextConfig;
