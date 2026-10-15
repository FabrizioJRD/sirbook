import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  transpilePackages: ['@sirbook/shared'],
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@sirbook/shared': path.resolve(__dirname, '../../packages/shared/dist/index.js'),
    };
    return config;
  },
};

export default nextConfig;
