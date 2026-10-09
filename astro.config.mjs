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
  integrations: [{
    name: 'require-published-snapshot',
    hooks: {
      'astro:config:setup': ({ command }) => {
        if (command === 'build' && !process.env.CMS_CONTENT_DIR && process.env.ALLOW_HISTORICAL_BUILD !== '1') {
          throw new Error('Construction refusée sans instantané publié. Utiliser npm run publish:local ou npm run build:prototype. Pour examiner l’historique : ALLOW_HISTORICAL_BUILD=1.');
        }
      },
    },
  }, mdx(), sitemap()],
  build: { inlineStylesheets: 'never' },
  vite: { plugins: [tailwindcss()], build: { assetsInlineLimit: 0 } },
});
