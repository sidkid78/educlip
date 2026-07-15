import type { NextConfig } from "next";

// The FastAPI backend serves its routes under /v1/* (see api/main.py).
// The frontend calls /api/v1/* so requests stay same-origin (no CORS in the
// browser); this rewrite proxies them through to FastAPI in dev and prod.
const API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${API_URL}/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
