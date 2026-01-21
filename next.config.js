/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self' * data: blob:; script-src 'self' 'unsafe-eval' 'unsafe-inline' *; style-src 'self' 'unsafe-inline' *; img-src 'self' blob: data: *; font-src 'self' data: *; connect-src 'self' *;",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
