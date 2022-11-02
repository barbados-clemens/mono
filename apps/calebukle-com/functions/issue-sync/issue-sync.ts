import { schedule } from '@netlify/functions';
import type { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';
import fetch from 'node-fetch';
import { Octokit } from 'octokit';

const GITHUB_PAT = process.env.GITHUB_PAT;
const HEIGHT_BASE_URL = 'https://api.height.app';
const HEIGHT_TOKEN = process.env.HEIGHT_TOKEN;
const ONE_HOUR_AGO_MS = 3_600_000;
const HEIGHT_ID_MAP = {
	lists: {
		nx: 'dbec20f6-e128-453a-a807-11dc5e4a2a77',
		inbox: 'da984a78-0178-4a31-81d0-f5562862e5a4',
		ghIssueTriage: '234e249b-af7c-4d29-8dc0-d78049817733',
	},
};
const ISSUE_KEYWORDS = ['jest', 'vitest', 'cypress', 'test'];
const client = new Octokit({ auth: GITHUB_PAT });
export const handler = schedule('@hourly', async (event) => {
	const issues = await getGitHubUpdateIssuesSince(
		new Date(Date.now() - ONE_HOUR_AGO_MS)
	);
	const newIssues = [];
	const existingIssue = [];
	for (const issue of issues) {
		if (await isNewIssue(issue.title)) {
			newIssues.push(issue);
		} else {
			existingIssue.push(issue);
		}
	}
	if (newIssues.length > 0) {
		const newTasks = newIssues.map((issue) => createNewHeightTask(issue));
		await Promise.all(newTasks);
	}

	if (existingIssue.length > 0) {
		console.log('TODO: update issues');
		console.table(existingIssue, ['title', 'url']);
	}
	return {
		statusCode: 200,
	};
});

async function getGitHubUpdateIssuesSince(since: Date) {
	console.log('querying issues since', since.toISOString());
	return await client.rest.issues
		.list({
			filter: 'all',
			state: 'open',
			since: since.toISOString(),
		})
		.then((r) => {
			console.log('Total issues updated: ', r.data.length);
			console.table(r.data, ['title', 'url']);
			const testingIssues = r.data.filter((d) => {
				if (ISSUE_KEYWORDS.some((k) => d.title.includes(k))) {
					return true;
				}
				if (
					d.labels.some((l) =>
						typeof l === 'string'
							? l.includes('test')
							: l.name?.includes('test')
					)
				) {
					return true;
				}
				return false;
			});
			console.log('Total testing issues updated', testingIssues.length);
			console.table(testingIssues, ['title', 'url']);
			return testingIssues;
		});
}

async function createNewHeightTask(
	ghIssue: RestEndpointMethodTypes['issues']['get']['response']['data']
) {
	console.log('making issue for ', ghIssue.title);
	return await fetch(`${HEIGHT_BASE_URL}/tasks`, {
		headers: {
			Authorization: `api-key ${HEIGHT_TOKEN}`,
			'Content-Type': 'application/json',
		},
		method: 'POST',
		body: JSON.stringify({
			listIds: [HEIGHT_ID_MAP.lists.ghIssueTriage, HEIGHT_ID_MAP.lists.nx],
			name: ghIssue.title,
			description: ghIssue.url,
		}),
	})
		.then((r) => r.json())
		.then((t: any) => {
			console.log(
				'Created new Height task ',
				t.url,
				' for GH issue',
				ghIssue.title
			);
		});
}

async function getHeightListIds(): Promise<any> {
	return await fetch(`${HEIGHT_BASE_URL}/lists`, {
		headers: {
			Authorization: `api-key ${HEIGHT_TOKEN}`,
			'Content-Type': 'application/json',
		},
	}).then((r) => r.json());
}

async function isNewIssue(title: string) {
	const items: any = await fetch(
		`${HEIGHT_BASE_URL}/tasks?query=${title}&limit=1&filters={}`,
		{
			headers: {
				Authorization: `api-key ${HEIGHT_TOKEN}`,
				'Content-Type': 'application/json',
			},
		}
	).then((r) => r.json());
	console.log('found issues ', items?.list?.length);
	console.table(items?.list, ['name', 'url']);
	return items?.list?.length === 0;
}
