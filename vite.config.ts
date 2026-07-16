import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
// base: './' makes the build use relative asset paths so it works from any
// sub-path on GitHub Pages (https://<user>.github.io/<repo>/) without extra config.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'FamilyPoints',
        short_name: 'FamilyPoints',
        description: 'Belohnungs- und Punktesystem für Familien',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        background_color: '#eaf1fa',
        theme_color: '#2c5f56',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Sorgt dafür, dass Client-seitiges Routing (HashRouter) auch offline/
        // beim erneuten Öffnen funktioniert, indem immer index.html als Basis dient.
        navigateFallback: 'index.html',
      },
    }),
  ],
  base: './',
})
