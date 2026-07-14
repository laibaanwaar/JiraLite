import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const projectCacheDir = process.env.VITE_CACHE_DIR || '../.cache/vite'

// https://vite.dev/config/
export default defineConfig({
  cacheDir: projectCacheDir,
  build: {
    outDir: 'dist',
  },
  plugins: [tailwindcss(), react()],
})
