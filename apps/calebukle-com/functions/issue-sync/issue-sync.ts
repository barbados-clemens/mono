import { schedule } from '@netlify/functions';
import asana from 'asana';
import { Octokit } from 'octokit';

const GITHUB_PAT = process.env.GITHUB_PAT;
const ASANA_TOKEN = process.env.ASANA_TOKEN;
const ONE_HOUR_AGO_MS = 3_600_000;
const ISSUE_KEYWORDS = ['jest', 'vitest', 'cypress', 'test', 'e2e'];
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
			createAsanaTaskAsync(issue.title, issue.html_url)
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
			console.table(r.data, ['title', 'html_url', 'created_at']);
			const testingIssues = r.data.filter((d) => {
				console.log('Processing', d.title, '(created at', d.created_at, ')');
				if (new Date(d.created_at) < since) {
					console.log('\tIssue was created before the since date');
					return false;
				}
				if (ISSUE_KEYWORDS.some((k) => d.title.includes(k))) {
					console.log('\tIssue contains keyword in title');
					return true;
				}
				if (
					d.labels.some((l) =>
						typeof l === 'string'
							? l.includes('test')
							: l.name?.includes('test')
					)
				) {
					console.log('\tIssue contains matching label', d.labels);
					return true;
				}
				console.log('\tIssue did not matching anything');
				return false;
			});

			console.log('Total testing issues updated', testingIssues.length);
			console.table(testingIssues, ['title', 'html_url', 'created_at']);
			return testingIssues;
		});
}

async function createAsanaTaskAsync(name: string, descrption: string) {
	return Promise.resolve();
	// const calebGID = '1201237969153910';
	// const nrwlWorkspaceGID = '989832235800250';
	// const ghIssueSectionGID = '1203641372517606';

	// return await ASANA_CLIENT.tasks
	// 	.createTask({
	// 		name: `[GH] ${name}`,
	// 		notes: descrption,
	// 		assignee: calebGID,
	// 		assignee_section: ghIssueSectionGID,
	// 		completed: false,
	// 		projects: [],
	// 		resource_type: 'task',
	// 		resource_subtype: 'default_task',
	// 		workspace: nrwlWorkspaceGID,
	// 		followers: [calebGID],
	// 	})
	// 	.then((r: any) => {
	// 		console.log(
	// 			'Created Asana Task',
	// 			r?.permalink_url,
	// 			`for issue ${name}(${descrption})`
	// 		);
	// 		return r;
	// 	});
}
