import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next writes coding-agent instruction files into the repo on dev start unless told not to.
  agentRules: false,
};

export default nextConfig;
