import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next writes AGENTS.md and CLAUDE.md into the repo on dev start unless told not to.
  agentRules: false,
};

export default nextConfig;
