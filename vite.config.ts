import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'screen.png'],
      manifest: {
        name: 'ShadowPod',
        short_name: 'ShadowPod',
        description: 'English shadowing practice with auto-transcription',
        theme_color: '#0d150d',
        background_color: '#0d150d',
        display: 'standalone',
        icons: [
          {
            src: 'screen.png',
            sizes: '400x400',
            type: 'image/png'
          },
          {
            src: 'screen.png',
            sizes: '400x400',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.deepgram\.com\/.*/i,
            handler: 'NetworkOnly'
          }
        ]
      }
    })
  ],
})
