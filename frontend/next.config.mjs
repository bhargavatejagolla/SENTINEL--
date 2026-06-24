/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://backend:8000/api/:path*",
      },
      {
        source: "/socket.io/:path*",
        destination: "http://backend:8000/socket.io/:path*",
      },
    ];
  },
};

export default nextConfig;
