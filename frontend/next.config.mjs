/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "http",  hostname: "localhost" },
      { protocol: "https", hostname: "sistema-vouchers-backend-production.up.railway.app" },
    ],
  },
};
export default nextConfig;
