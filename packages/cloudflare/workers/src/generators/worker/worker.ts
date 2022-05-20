import {
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  joinPathFragments,
  names,
  offsetFromRoot,
  readProjectConfiguration,
  Tree,
  updateJson,
  updateProjectConfiguration,
} from '@nrwl/devkit';
import { libraryGenerator as jsLib } from '@nrwl/js';
import { offset } from '@nrwl/workspace/src/utils/ast-utils';
import * as path from 'path';
import { workerInit } from '../init/generator';
import { moveGenerator } from '@nrwl/workspace/generators';
import { CloudflareWorkersGeneratorSchema } from './schema';

interface NormalizedSchema extends CloudflareWorkersGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
}

function normalizeOptions(
  tree: Tree,
  options: CloudflareWorkersGeneratorSchema
): NormalizedSchema {
  const name = names(options.name).fileName;
  const projectDirectory = options.directory
    ? `${names(options.directory).fileName}/${name}`
    : name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const projectRoot = `${getWorkspaceLayout(tree).libsDir}/${projectDirectory}`;
  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];

  return {
    ...options,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
  };
}

function addFiles(tree: Tree, options: NormalizedSchema) {
  const n = names(options.name);
  const offset = offsetFromRoot(options.projectRoot);
  const templateOptions = {
    ...options,
    ...n,
    compatibilityDate: new Date().toISOString().split('T')[0],
    offsetFromRoot: offset,
    tmpl: '',
  };
  generateFiles(
    tree,
    path.join(__dirname, 'files'),
    options.projectRoot,
    templateOptions
  );

  tree.write(
    joinPathFragments(options.projectRoot, 'src', 'index.ts'),
    `
import { handleRequest } from './lib/request-handler';
addEventListener("fetch", (event) => {
  console.log('hello from event listener');
  event.respondWith(handleRequest(event.request));
});
  `
  );
  tree.delete(
    joinPathFragments(options.projectRoot, 'src', 'lib', `${n.fileName}.ts`)
  );
  updateJson(
    tree,
    joinPathFragments(options.projectRoot, 'package.json'),
    (json) => {
      json.type = 'module';
      return json;
    }
  );
}

export async function workerApp(
  tree: Tree,
  options: CloudflareWorkersGeneratorSchema
) {
  const normalizedOptions = normalizeOptions(tree, options);
  const cfWorkerInitTask = workerInit(tree);
  await jsLib(tree, {
    name: normalizedOptions.projectName,
    tags: normalizedOptions.tags,
    buildable: true,
    unitTestRunner: 'none',
    compiler: 'tsc',
    skipFormat: true,
    config: 'project',
  });
  // TODO(caleb): move to apps dir.
  // await moveGenerator(tree, {
  //   projectName: normalizedOptions.projectName,
  //   destination: `apps/${normalizedOptions.projectName}`,
  //   updateImportPath: true,
  // });
  console.log(normalizedOptions, tree.read('workspace.json', 'utf-8'));
  const projectConfig = readProjectConfiguration(
    tree,
    normalizedOptions.projectName
  );

  updateJson(
    tree,
    joinPathFragments(projectConfig.root, 'tsconfig.lib.json'),
    (json: TsConfig) => {
      json.include = json.include || [];

      json.include.push(
        `${offset}node_modules/@cloudflare/workers-types/index.d.ts`
      );
      json.compilerOptions = {
        module: 'es2022',
        target: 'es2021',
        lib: ['es2021'],
        moduleResolution: 'node',
        resolveJsonModule: true,
        allowJs: true,
        checkJs: true,
        noEmit: true,
        isolatedModules: true,
        allowSyntheticDefaultImports: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        strict: true,
        noImplicitOverride: true,
        noPropertyAccessFromIndexSignature: true,
        noImplicitReturns: true,
        noFallthroughCasesInSwitch: true,
      };
      return json;
    }
  );

  projectConfig.targets['serve'] = {
    executor: '@nrwl/workspace:run-commands',
    options: {
      commands: [
        'npx wrangler dev src/index.ts --tsconfig=tsconfig.lib.json --env=dev',
      ],
      cwd: normalizedOptions.projectRoot,
    },
    configurations: {
      production: {
        commands: [
          'npx wrangler dev src/index.ts --tsconfig=tsconfig.lib.json --env=production',
        ],
      },
    },
  };

  projectConfig.targets['publish'] = {
    executor: '@nrwl/workspace:run-commands',
    options: {
      commands: [
        `npx wrangler publish dist/${normalizedOptions.projectName} --env=dev`,
      ],
    },
    configurations: {
      production: {
        commands: ['npx wrangler publish dist/${} --env=production'],
      },
    },
  };
  updateProjectConfiguration(
    tree,
    normalizedOptions.projectName,
    projectConfig
  );
  addFiles(tree, normalizedOptions);

  return () => {
    formatFiles(tree);
    cfWorkerInitTask();
  };
}

export default workerApp;

interface TsConfig {
  include?: string[];
  compilerOptions?: Record<string, unknown>;
}
