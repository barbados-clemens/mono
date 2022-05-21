import { readProjectConfiguration, Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { workerApp } from './worker';

describe('cloudflare-workers generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace(2);
  });

  it('should generate files', async () => {
    await workerApp(tree, {
      name: 'my-worker-app',
    });

    const config = readProjectConfiguration(tree, 'my-worker-app');
    const wranglerConfig = tree.read(
      'apps/my-worker-app/wrangler.toml',
      'utf-8'
    );
    expect(wranglerConfig).toContain('name = "my-worker-app"');
    expect(wranglerConfig).toContain('compatibility_date = "');
    expect(tree.exists('apps/my-worker-app/src/index.ts')).toBeTruthy();
    expect(
      tree.exists('apps/my-worker-app/src/request-handler.ts')
    ).toBeTruthy();
    expect(config).toMatchSnapshot();
  });
});
