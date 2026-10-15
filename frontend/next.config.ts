import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow phone access on LAN and public tunnels without dev origin blocking
  allowedDevOrigins: [
    "*.loca.lt",
    "waste2worth-live.loca.lt",
    "*.localtunnel.me",
    "*.ngrok-free.app",
    "*.ngrok.app",
    "*.ngrok.io",
    "*.trycloudflare.com",
    "*.lhr.life",
    "*.onrender.com",
    "*.vercel.app",
    "192.168.1.45",
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
  ],
  async rewrites() {
    let rawUrl =
      process.env.BACKEND_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_AI_API_URL ||
      "http://127.0.0.1:8000";

    let backendUrl = rawUrl.trim().replace(/\/+$/, "");
    if (!backendUrl.startsWith("http://") && !backendUrl.startsWith("https://")) {
      // Handle Render private networking hostnames or domain names missing protocol
      backendUrl = backendUrl.includes(":") ? `http://${backendUrl}` : `https://${backendUrl}`;
    }

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
