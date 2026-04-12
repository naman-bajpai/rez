import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.ngrok-free.dev",
    "*.ngrok.io",
    "*.ngrok.app",
    "sha-foraminiferous-kaitlin.ngrok-free.dev",
    "localhost",
  ],
};

export default nextConfig;
