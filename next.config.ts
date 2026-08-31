import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This repo keeps no generated agent rule files.
  agentRules: false,
};

export default nextConfig;
