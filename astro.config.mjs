import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://santinnovation.fr",
  trailingSlash: "ignore",
  prefetch: true,
  integrations: [
    mdx(),
    // L'espace pro (démo, noindex) n'a rien à faire dans le sitemap.
    sitemap({ filter: (page) => !page.includes("/pro") }),
  ],
  build: {
    // Aucun style inline dans le HTML : la CSP (public/.htaccess) reste stricte.
    inlineStylesheets: "never",
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Aucun script inline : script-src 'self' (cf. public/.htaccess).
      assetsInlineLimit: 0,
    },
  },
});
