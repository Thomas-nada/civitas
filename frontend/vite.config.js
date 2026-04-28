import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      "/ekklesia-proxy": {
        target: "https://hydra-voting.intersectmbo.org",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/ekklesia-proxy/, ""),
      },
    },
  },
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'crypto', 'stream', 'events'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ],
})
