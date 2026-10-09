import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// No production operation is implied by a local build. The production release
// script additionally demands the CMS snapshot and explicit content validation.
export default defineConfig({
  site: process.env.SITE_URL || 'https://santinnovation.fr',
  base: process.env.SITE_BASE || '/',
  outDir: process.env.BUILD_OUT_DIR || './dist',
  trailingSlash: 'always',
  prefetch: false,
  integrations: [mdx(), sitemap()],
  build: { inlineStylesheets: 'never' },
  vite: { plugins: [tailwindcss()], build: { assetsInlineLimit: 0 } },
});
