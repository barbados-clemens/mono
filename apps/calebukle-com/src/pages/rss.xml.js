import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../config';

const postImportResult = import.meta.glob('./blog/**/*.md', { eager: true });
const posts = Object.values(postImportResult);

export const get = () =>
  rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: import.meta.env.SITE,
    items: posts.map((p) => {
      return {
        ...p,
        link: p.url,
        title: p.frontmatter.title,
        pubDate: p.frontmatter.pubDate,
      };
    }),
  });
