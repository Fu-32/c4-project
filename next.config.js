/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Utilisation du mode standalone pour les routes API
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

module.exports = nextConfig;