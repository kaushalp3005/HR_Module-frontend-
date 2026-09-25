import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Without this Next infers the workspace root as the parent folder (the repo has no
  // package.json there), and Tailwind then looks for "tailwindcss" outside frontend/.
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'candor-worker-docs.s3.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's3.amazonaws.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
