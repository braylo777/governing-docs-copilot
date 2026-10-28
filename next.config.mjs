/** Static export: the demo runs Postgres (PGlite + pgvector) in the browser, so it hosts on Cloudflare Pages with no server. */
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  webpack: (config) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true, topLevelAwait: true };
    config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false, crypto: false, module: false, url: false, os: false, child_process: false };
    return config;
  },
};
export default nextConfig;
