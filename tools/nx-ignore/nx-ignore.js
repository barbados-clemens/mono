#!/usr/bin/env node
const { findWorkspaceRoot } = require('nx/src/utils/find-workspace-root');

/**
 *
 * @param options {project: string, baseSha: string, headSha: string}
 * @returns {Promise<boolean>}
 */
async function isProjectAffected({ project, baseSha, headSha }) {
	if (!project) {
		console.log('≫ No project passed to nx-ignore script');
		return true;
	}

	console.log(
		`≫ Using Nx to determine if this project (${project}) is affected by the commit...`
	);

	const root = findWorkspaceRoot(process.cwd());

	if (!root) {
		console.log('≫ Could not find Nx root');
		return true;
	}

	const { affected } = require('nx/src/command-line/affected');
	let result = { projects: [] };

	console.log(`\n≫ Comparing ${baseSha}...${headSha}\n`);

	// TODO(jack): This console.log hack isn't needed if Nx can support being installed outside of cwd.
	const _log = console.log;

	try {
		let output = '';
		console.log = (x) => {
			output = x;
		};

		await affected('print-affected', {
			_: '',
			base: baseSha,
			head: headSha,
		});

		result = JSON.parse(output);
	} catch (e) {
		console.error(e);
	} finally {
		console.log = _log;
	}

	console.log(`≫ Affected projects:\n  - ${result.projects.join('\n  - ')}\n`);

	if (result.projects.includes(project)) {
		console.log(`✅ - Build can proceed since ${project} is affected`);
		return true;
	} else {
		console.log(`🛑 - Build cancelled since ${project} is not affected`);
	}
	return false;
}
module.exports.isProjectAffected = isProjectAffected;
