import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "mdx"],
  experimental: { viewTransition: true },
};

export default createMDX({})(nextConfig);
