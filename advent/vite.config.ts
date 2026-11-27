import { defineConfig, type ProxyOptions } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// `vite build --mode civitas` builds the calendar for civitasexplorer.com/advent/.
const CIVITAS = { base: "advent", site: "https://www.civitasexplorer.com/advent" };

export default defineConfig(({ mode }) => {
  const civitas = mode === "civitas";

  // Where the app lives on its site: "/" on its own domain, "/advent/" inside Civitas.
  // ADVENT_BASE overrides it; the result always has a leading and trailing slash.
  const raw = process.env.ADVENT_BASE ?? (civitas ? CIVITAS.base : "");
  const base = `/${raw.replace(/^\/+|\/+$/g, "")}/`.replace(/^\/\/$/, "/");

  // Koios doesn't send Access-Control-Allow-Origin on real responses, so the
  // browser talks to <base>koios/<net>/… on our own origin and we forward it.
  const koios = (host: string): ProxyOptions => ({
    target: `https://${host}.koios.rest`,
    changeOrigin: true,
    rewrite: (p) => p.replace(/^.*?\/koios\/[a-z]+/, "/api/v1"),
  });
  const proxy = {
    [`${base}koios/mainnet`]: koios("api"),
    [`${base}koios/preprod`]: koios("preprod"),
    [`${base}koios/preview`]: koios("preview"),
  };

  // Link previews (og:image etc. in index.html) need the site's absolute URL.
  // Use VITE_SITE_URL if set, else the Civitas address in civitas mode, else what Netlify (URL)
  // or Vercel provide at build time, else empty, so local builds get root-relative paths
  // instead of a literal "%VITE_SITE_URL%".
  process.env.VITE_SITE_URL = (
    process.env.VITE_SITE_URL ||
    (civitas ? CIVITAS.site : "") ||
    process.env.URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "")
  ).replace(/\/+$/, "");

  return {
    base,
    plugins: [
      // Mesh SDK pulls in a few Node built-ins (Buffer, crypto, stream).
      nodePolyfills({
        include: ["buffer", "crypto", "stream", "util", "process", "events"],
        globals: { Buffer: true, global: true, process: true },
      }),
    ],
    build: { target: "esnext", chunkSizeWarningLimit: 8000 },
    server: { port: 5173, proxy },
    preview: { port: 4173, proxy },
  };
});
