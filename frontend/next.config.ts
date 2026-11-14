import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // FastAPI's list route requires a trailing slash. Avoid an upstream
      // redirect that would send the browser (and lose its cookie) to 127.0.0.1.
      { source: "/api/grievances", destination: "http://127.0.0.1:8000/api/grievances/" },
      { source: "/api/:path*", destination: "http://127.0.0.1:8000/api/:path*" },
    ];
  },
  /* config options here */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
