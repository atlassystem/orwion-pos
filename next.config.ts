import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Bu projenin kök dizini — birden fazla lockfile uyarısını susturur.
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
