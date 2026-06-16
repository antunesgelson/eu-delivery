import os from 'node:os';

const getLocalDevOrigins = () => {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((networkInterface) => networkInterface?.family === 'IPv4' && !networkInterface.internal)
    .map((networkInterface) => networkInterface.address);
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: getLocalDevOrigins(),
  images: {
    domains: ['s3.seu.dev.br', 'github.com'],
  },
};

export default nextConfig;
