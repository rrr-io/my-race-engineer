import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Custom SW, needed for push
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'RACE ENGENEer',
        short_name: 'RACE ENGENEer',
        description: 'Your personal race engineer for ENHYPEN MAMA voting',
        theme_color: '#0E0F12',
        background_color: '#0E0F12',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192-v2.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512-v2.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512-v2.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      devOptions: { enabled: true, type: 'module' }
    })
  ],
  server: {
    proxy: { '/api': 'http://localhost:8080' }
  }
})
