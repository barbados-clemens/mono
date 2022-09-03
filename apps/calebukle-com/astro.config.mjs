import {defineConfig} from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  markdown: {
    syntaxHighlight: 'prism'
  },
  site: 'https://calebukle.com',
  integrations: [mdx(), sitemap(), tailwind()],
  outDir: '../../dist/apps/calebukle-com'
});
