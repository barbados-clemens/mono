import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';

import svelte from "@astrojs/svelte";

// https://astro.build/config
export default defineConfig({
  site: 'https://calebukle.com',
  integrations: [mdx(), sitemap(), tailwind(), svelte()],
  outDir: '../../dist/apps/calebukle-com'
});