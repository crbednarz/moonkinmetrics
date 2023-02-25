/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'render.worldofwarcraft.com',
        port: '',
        pathname: '/us/icons/**',
      },
    ],
  },
}

module.exports = nextConfig
