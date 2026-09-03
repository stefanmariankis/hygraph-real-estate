import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This repo keeps no generated agent rule files.
  agentRules: false,

  // Emit a plain folder of HTML/CSS/JS so the site can be served straight from
  // S3 + CloudFront, with no Node runtime.
  output: "export",

  // Without this the export writes `property/<slug>.html`, which S3 will not
  // serve at `/property/<slug>`. With it, each route becomes its own directory
  // containing `index.html` — exactly what S3's index document expects.
  trailingSlash: true,
};

export default nextConfig;
