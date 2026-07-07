/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable caching để tránh hiện bài tập cũ
  experimental: {
    middlewareClientMaxBodySize: "210mb",
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
