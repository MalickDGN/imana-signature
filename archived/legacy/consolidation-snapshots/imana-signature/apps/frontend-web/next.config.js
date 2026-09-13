/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  transpilePackages: [
    '@imana-signature/shared-types',
    '@imana-signature/utils',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fakestoreapi.com',
      },
    ],
  },
  async rewrites() {
    const apiGatewayUrl =
      process.env.API_GATEWAY_URL || 'http://localhost:3001';

    return [
      {
        source: '/api/:path*',
        destination: `${apiGatewayUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
