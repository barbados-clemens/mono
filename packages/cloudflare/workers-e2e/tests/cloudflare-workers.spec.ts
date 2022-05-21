import {
  checkFilesExist,
  ensureNxProject,
  readJson,
  runNxCommandAsync,
  uniq,
} from '@nrwl/nx-plugin/testing';

describe('cloudflare-workers e2e', () => {
  // Setting up individual workspaces per
  // test can cause e2e runs to take a long time.
  // For this reason, we recommend each suite only
  // consumes 1 workspace. The tests should each operate
  // on a unique project in the workspace, such that they
  // are not dependent on one another.
  beforeAll(() => {
    ensureNxProject(
      '@mono-ukulele/cf-workers',
      'dist/packages/cloudflare/workers'
    );
  });

  afterAll(() => {
    // `nx reset` kills the daemon, and performs
    // some work which can help clean up e2e leftovers
    runNxCommandAsync('reset');
  });

  it('should publish (dry-run)', async () => {
    const project = uniq('cloudflare-workers');
    await runNxCommandAsync(
      `generate @mono-ukulele/cf-workers:worker ${project}`
    );
    const result = await runNxCommandAsync(`publish ${project} -- --dry-run`);
    expect(result.stdout).toContain('--dry-run: exiting now.');
    expect(result.stdout).toContain('Successfully ran target publish');
  }, 120000);

  describe('--directory', () => {
    it('should create src in the specified directory', async () => {
      const project = uniq('cloudflare-workers');
      await runNxCommandAsync(
        `generate @mono-ukulele/cf-workers:worker ${project} --directory subdir`
      );
      expect(() =>
        checkFilesExist(`apps/subdir/${project}/src/index.ts`)
      ).not.toThrow();
      expect(() =>
        checkFilesExist(`apps/subdir/${project}/src/request-handler.ts`)
      ).not.toThrow();
    }, 120000);
  });

  describe('--tags', () => {
    it('should add tags to the project', async () => {
      const projectName = uniq('cloudflare-workers');
      ensureNxProject(
        '@mono-ukulele/cf-workers',
        'dist/packages/cloudflare/workers'
      );
      await runNxCommandAsync(
        `generate @mono-ukulele/cf-workers:worker ${projectName} --tags e2etag,e2ePackage`
      );
      const project = readJson(`apps/${projectName}/project.json`);
      expect(project.tags).toEqual(['e2etag', 'e2ePackage']);
    }, 120000);
  });
});
