/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets a phone reach the dev server through an HTTPS tunnel (ngrok / cloudflared)
  allowedDevOrigins: ['*.ngrok-free.app', '*.ngrok-free.dev', '*.trycloudflare.com'],
};

export default nextConfig;
