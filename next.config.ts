import type { NextConfig } from "next";

// Три режима сборки:
//
// 1. Vercel (по умолчанию): output=standalone, с API-роутами
//    Команда: next build
//
// 2. GitHub Pages: STATIC_EXPORT=true, basePath=/home_psychologist
//    Команда: STATIC_EXPORT=true next build
//    URL: https://evikass.github.io/home_psychologist/
//
// 3. VK Hosting / OK: STATIC_EXPORT=true VK_HOSTING=true, БЕЗ basePath
//    Команда: STATIC_EXPORT=true VK_HOSTING=true next build
//    URL: https://vk-app.ru/... (корень домена)

const isStaticExport = process.env.STATIC_EXPORT === "true";
const isVKHosting = process.env.VK_HOSTING === "true";

// basePath нужен ТОЛЬКО для GitHub Pages (репозиторий не корневой)
// Для VK Hosting / OK — ассеты в корне, basePath не нужен
const needsBasePath = isStaticExport && !isVKHosting;

const nextConfig: NextConfig = {
  output: isStaticExport ? "export" : "standalone",
  basePath: needsBasePath ? "/home_psychologist" : "",
  assetPrefix: needsBasePath ? "/home_psychologist/" : "",
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
