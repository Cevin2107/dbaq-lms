/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Tránh bundle các thư viện Node server nặng làm chậm build & dev compile
  serverExternalPackages: [
    "googleapis",
    "pdf-parse",
    "sharp",
    "bcryptjs",
    "@simplewebauthn/server"
  ],
  experimental: {
    middlewareClientMaxBodySize: "210mb",
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "@tanstack/react-query",
      "katex"
    ],
    staleTimes: {
      dynamic: 0,
      static: 0
    }
  },
  webpack: (config) => {
    // Required for react-pdf / pdfjs-dist to work correctly with webpack
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};

module.exports = nextConfig;
