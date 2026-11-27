import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Trace from the repo root so ../docs is reachable and the parent pnpm lockfile is ignored.
  outputFileTracingRoot: path.join(here, ".."),
  // Pages are read from ../docs at build time; include them in serverless traces.
  outputFileTracingIncludes: { "/**": ["../docs/**/*.md"] },
  async redirects() {
    return [
      // Old GitBook space-prefixed URLs.
      { source: "/3siU1aRQuBacUegbFReN", destination: "/", permanent: true },
      { source: "/3siU1aRQuBacUegbFReN/:path*", destination: "/:path*", permanent: true },
      { source: "/getting-started/readme", destination: "/", permanent: true },
      { source: "/getting-started", destination: "/", permanent: true },
      // SDK 0.17.0 removed the browser extension; its contract page is retired.
      {
        source: "/integrations/agentic-platforms/extension-contract",
        destination: "/integrations/agentic-platforms/browser-connector-interface",
        permanent: true,
      },
      // The three one-time authorization token pages were merged into one.
      ...["one-time-authorization-token-1", "one-time-authorization-token-directauthtoken", "authtoken"].map((slug) => ({
        source: `/integrations/${slug}`,
        destination: "/integrations/one-time-authorization-token",
        permanent: true,
      })),
    ];
  },
};

export default nextConfig;
