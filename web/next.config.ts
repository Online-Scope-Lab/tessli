import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // /contribute replaced the /submit and /suggest placeholders (plan §5).
  // permanent: true answers 308, so old links keep working.
  async redirects() {
    return [
      { source: "/submit", destination: "/contribute", permanent: true },
      { source: "/suggest", destination: "/contribute", permanent: true },
    ];
  },
};

export default nextConfig;
