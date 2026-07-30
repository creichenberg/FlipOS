/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // listing photo uploads
    },
  },
};

module.exports = nextConfig;
