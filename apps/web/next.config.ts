import type { NextConfig } from 'next';
import path from 'node:path';

const config: NextConfig = {
  reactStrictMode: true,
  // Emit a minimal self-contained server bundle for Docker runtime.
  output: 'standalone',
  // Libs are TS source — transpile them.
  transpilePackages: ['@planning/types', '@planning/utils'],
  // Tell Next.js the workspace root so tracing file dependencies works
  // correctly in a monorepo.
  outputFileTracingRoot: path.join(__dirname, '../..'),
  typedRoutes: true,
  experimental: {
    // Server Actions are on by default in 15; this just bumps the limit.
    serverActions: { bodySizeLimit: '1mb' },
  },
};

export default config;
