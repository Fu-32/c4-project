/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Permet l'utilisation des routes API dynamiques
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