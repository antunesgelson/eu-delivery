import os from 'node:os';
import { fileURLToPath } from 'node:url';

const getLocalDevOrigins = () => {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((networkInterface) => networkInterface?.family === 'IPv4' && !networkInterface.internal)
    .map((networkInterface) => networkInterface.address);
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mantém o build de produção separado do servidor de desenvolvimento.
  distDir: process.env.NODE_ENV === 'development' ? '.next' : '.next-production',
  outputFileTracingRoot: fileURLToPath(new URL('.', import.meta.url)),
  allowedDevOrigins: getLocalDevOrigins(),
  images: {
    domains: ['s3.seu.dev.br', 'github.com'],
  },
};

export default nextConfig;
