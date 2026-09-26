import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow phone access on LAN and public tunnels without dev origin blocking
  allowedDevOrigins: [
    "*.lhr.life",
    "*.loca.lt",
    "*.trycloudflare.com",
    "*.ngrok-free.app",
    "192.168.1.45",
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
  ],
  async rewrites() {
    const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/predict",
        destination: `${backendUrl}/predict`,
      },
      {
        source: "/uploads/:path*",
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
