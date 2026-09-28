import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig({
  build: {
    // AD-18 Font: never inline the font as a data: URL, so the build holds it once and the
    // index.html preload matches the @font-face URL; other assets keep Vite's default.
    assetsInlineLimit: (file) => (file.endsWith('.woff2') ? false : undefined),
  },
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'WordCell',
        short_name: 'WordCell',
        description: 'A solo FreeCell-style word game.',
        display: 'standalone',
        display_override: ['fullscreen', 'standalone'],
        orientation: 'portrait',
        background_color: '#1c2331',
        theme_color: '#1c2331',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache everything the build emits, including the dictionary.
        globPatterns: ['**/*.{js,css,html,svg,png,txt,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  test: {
    // Engine, unit and script tests only. End-to-end tests live in e2e/ and run under Playwright.
    include: ['src/**/*.test.ts', 'scripts/**/*.test.mjs'],
    environment: 'node',
    coverage: { include: ['src/engine/**'] },
  },
});
