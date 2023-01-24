import rss, { pagesGlobToRssItems } from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../config';

export async function get(context) {
	const postImportResult = import.meta.glob('./blog/**/*.md', { eager: true });
	const posts = Object.values(postImportResult);

	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: posts.map((p) => {
			return {
				...p,
				link: p.url,
				title: p.frontmatter.title,
				pubDate: p.frontmatter.pubDate || p.frontmatter.publish_date,
			};
		}),
	});
}
