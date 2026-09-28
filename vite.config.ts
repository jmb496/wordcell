import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig({
  build: {
    // AD-18 Font: never inline the font as a data: URL, so the build holds it once and the
    // index.html preload matches the @font-face URL; other assets keep Vite's default.
    // AD-18 (Scaffold deltas): dist/.vite/manifest.json for the CAP-6 size check.
    manifest: true,
    assetsInlineLimit: (file) => (file.endsWith('.woff2') ? false : undefined),
  },
  plugins: [
    svelte(),
    VitePWA({
      // AD-16: no automatic registration; epic 7's src/shell/sw.ts registers the worker.
      registerType: 'prompt',
      injectRegister: false,
      // AD-16: one precache entry per URL. The globPatterns already match the manifest icons.
      includeManifestIcons: false,
      // DESIGN.md A-D5; the plugin adds start_url, scope and lang.
      manifest: {
        name: 'WordCell',
        short_name: 'WordCell',
        description: 'A solo word card game in the spirit of FreeCell.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#15171B',
        theme_color: '#15171B',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // AD-16: precache everything the build emits, including the dictionary (AD-8).
        globPatterns: ['**/*.{js,css,html,txt,woff2,png,svg,webmanifest}'],
        // The plugin adds its own manifest.webmanifest entry, so the glob skips that file. This
        // replaces workbox-build's default ignore list (it still skips sw.js and workbox-*.js).
        globIgnores: ['manifest.webmanifest'],
        maximumFileSizeToCacheInBytes: 4_000_000,
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
