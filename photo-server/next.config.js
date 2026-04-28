/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'pub-e12eb7874b084e1da7840ee4870ec95f.r2.dev' },
    ],
  },
};

module.exports = nextConfig;
