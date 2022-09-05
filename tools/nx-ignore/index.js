const { isProjectAffected } = require('./nx-ignore');
module.exports = {
	onBuild: async ({ utils }) => {
		console.log('hello from onPreBuild');
		const customBase = process.env['NX_BASE'];
		// process.env['VERCEL_GIT_PREVIOUS_SHA'] ||
		const ciBase = process.env['CACHED_COMMIT_REF'];
		const baseSha = customBase ? customBase.slice(7) : ciBase ?? 'HEAD^';
		const headSha = 'HEAD';
		if (
			await isProjectAffected({
				project: process.env.NX_PROJECT,
				baseSha,
				headSha,
			})
		) {
			utils.status.show({
				summary: 'Project affected. Proceeding with build.',
			});
		} else {
			utils.build.cancelBuild('Build cancelled since project is not affected');
		}
	},
};
