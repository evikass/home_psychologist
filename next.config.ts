import type { NextConfig } from "next";

// STATIC_EXPORT переключает сборку для GitHub Pages.
// На Vercel/обычном dev — оставляем standalone с API-роутами.
// На GitHub Pages — static export без API (используется demo-режим).
const isStaticExport = process.env.STATIC_EXPORT === "true";

const nextConfig: NextConfig = {
  output: isStaticExport ? "export" : "standalone",
  // basePath нужен только для GitHub Pages (репозиторий не корневой)
  basePath: isStaticExport ? "/home_psychologist" : "",
  assetPrefix: isStaticExport ? "/home_psychologist/" : "",
  trailingSlash: isStaticExport,
  images: {
    unoptimized: isStaticExport,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
