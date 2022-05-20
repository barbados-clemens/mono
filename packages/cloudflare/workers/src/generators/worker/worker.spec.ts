import {createTreeWithEmptyWorkspace} from '@nrwl/devkit/testing';
import {readProjectConfiguration, Tree} from '@nrwl/devkit';
import {workerApp} from './worker'

describe('cloudflare-workers generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace(2);
  });

  it('should generate files', async () => {
    await workerApp(tree, {
      name: 'my-worker-app',
    })

    const config = readProjectConfiguration(tree, 'my-worker-app');
    expect(tree.read('libs/my-worker-app/wranger.toml', 'utf-8')).toMatchSnapshot();
    expect(tree.exists('libs/my-worker-app/src/index.ts')).toBeTruthy();
    expect(tree.exists('libs/my-worker-app/src/lib/request-handler.ts')).toBeTruthy();
    expect(config.targets['serve']).toMatchSnapshot();
    expect(config.targets['build']).toBeTruthy();
  });
});
