const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images-api.printify.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/demo-integrated/:path*",
        destination: "/integrated/:path*",
      },
      {
        source: "/demo-integrated-rememberme/:path*",
        destination: "/integrated3/:path*",
      },
      {
        source: "/products/:path*",
        destination: "/pdp/:path*",
      },
      {
        source: "/products-rememberme/:path*",
        destination: "/pdp2/:path*",
      },
    ];
  },
};

export default nextConfig;
