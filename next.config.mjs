/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Prevent mongoose from being bundled — it must run as a native Node module
  serverExternalPackages: ['mongoose'],
  // Reduce unnecessary re-renders
  reactStrictMode: false,
};

export default nextConfig;
