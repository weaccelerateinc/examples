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
};

export default nextConfig;
