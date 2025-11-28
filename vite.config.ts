import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Mariage Christiane & Serge',
        short_name: 'C&S 2025',
        description: 'Application officielle du mariage de Christiane & Serge',
        theme_color: '#f8fafc',
        background_color: '#f8fafc',
        display: 'standalone', // Cache la barre d'URL
        orientation: 'portrait', // Force le mode portrait
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'https://cdn-icons-png.flaticon.com/512/3004/3004613.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'https://cdn-icons-png.flaticon.com/512/3004/3004613.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        screenshots: [
          {
            src: "https://images.unsplash.com/photo-1519225469958-305e68780cf9?auto=format&fit=crop&w=1080&q=80",
            sizes: "1080x1920",
            type: "image/jpeg",
            form_factor: "wide",
            label: "Programme du Mariage"
          },
          {
            src: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1080&q=80",
            sizes: "1080x1920",
            type: "image/jpeg",
            form_factor: "narrow",
            label: "Check-in Invités"
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
            {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                    cacheName: 'google-fonts-cache',
                    expiration: {
                        maxEntries: 10,
                        maxAgeSeconds: 60 * 60 * 24 * 365 // 1 an
                    },
                    cacheableResponse: {
                        statuses: [0, 200]
                    }
                }
            }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000
  }
});