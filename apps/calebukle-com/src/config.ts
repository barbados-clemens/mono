// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.
interface BlogPost {
	frontmatter: Frontmatter;
	file: string;
	url: string;
	getHeadings: () => { depth: number; slug: string; text: string }[];
	rawContent: () => string;
	compildedContent: () => string;
}
interface Frontmatter {
	[key: string]: any;
	title: string;
	description: string;
	publish_date: string;
	updated_date?: string;
	img?: string;
	tags?: string[];
}
export const SITE_TITLE = 'Caleb Ukle';
export const SITE_DESCRIPTION =
	'This is where I write about random things that are interesting to me. Enjoy!';

export function normalizePost(
	post: Frontmatter
): Frontmatter & {
	formatted_publish_date: string | null;
	formatted_updated_date: string | null;
} {
	const dtf = new Intl.DateTimeFormat('en-US', { dateStyle: 'long' });
	return {
		...post,
		formatted_publish_date: post.publish_date
			? dtf.format(new Date(post.publish_date))
			: null,
		formatted_updated_date: post.updated_date
			? dtf.format(new Date(post.updated_date))
			: null,
	};
}

export function normalizePosts(posts: BlogPost[]): BlogPost[] {
	return posts
		.filter((p) => !p.frontmatter?.draft)
		.map((p) => ({ ...p, frontmatter: normalizePost(p.frontmatter) }))
		.sort(
			(a, b) =>
				new Date(b.frontmatter.publish_date).valueOf() -
				new Date(a.frontmatter?.publish_date).valueOf()
		);
}
