import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// base: './' makes the build use relative asset paths so it works from any
// sub-path on GitHub Pages (https://<user>.github.io/<repo>/) without extra config.
export default defineConfig({
  plugins: [react()],
  base: './',
})
