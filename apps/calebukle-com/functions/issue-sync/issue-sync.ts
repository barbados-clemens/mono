import { schedule } from '@netlify/functions';
import asana from 'asana';
import { Octokit } from 'octokit';

const GITHUB_PAT = process.env.GITHUB_PAT;
const ASANA_TOKEN = process.env.ASANA_TOKEN;
const ONE_HOUR_AGO_MS = 3_600_000;
const ISSUE_KEYWORDS = ['jest', 'vitest', 'cypress', 'test'];
const GH_CLIENT = new Octokit({ auth: GITHUB_PAT });
const ASANA_CLIENT = asana.Client.create({
	defaultHeaders: {
		'Asana-Enable': 'new_user_task_lists',
	},
}).useAccessToken(ASANA_TOKEN);

export const handler = schedule('@hourly', async (event) => {
	const issues = await getGitHubUpdateIssuesSince(
		new Date(Date.now() - ONE_HOUR_AGO_MS)
	);

	if (issues.length > 0) {
		const newTasks = issues.map((issue) =>
			createAsanaTaskAsync(issue.title, issue.url)
		);
		await Promise.all(newTasks);
	}

	return {
		statusCode: 200,
	};
});

async function getGitHubUpdateIssuesSince(since: Date) {
	console.log('querying issues since', since.toISOString());
	return await GH_CLIENT.rest.issues
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

async function createAsanaTaskAsync(name: string, descrption: string) {
	const calebGID = '1201237969153910';
	const nrwlWorkspaceGID = '989832235800250';
	return await ASANA_CLIENT.tasks
		.createTask({
			name: `[GH] ${name}`,
			notes: descrption,
			assignee: calebGID,
			completed: false,
			projects: [],
			resource_type: 'task',
			resource_subtype: 'default_task',
			workspace: nrwlWorkspaceGID,
			followers: [calebGID],
		})
		.then((r: any) => {
			console.log('Created Asana Task', r.url, 'for issue', descrption);
		});
}
