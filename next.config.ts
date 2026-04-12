import type { NextConfig } from "next";

// Next types may lag; `allowedDevHosts` is used for tunnel dev (e.g. ngrok).
const nextConfig = {
  allowedDevHosts: [
    "*.ngrok-free.dev",
    "*.ngrok.io",
    "*.ngrok.app",
    "localhost",
  ],
} as NextConfig;

export default nextConfig;
