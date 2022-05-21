import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  GeneratorCallback,
  getWorkspaceLayout,
  joinPathFragments,
  names,
  offsetFromRoot,
  Tree,
} from '@nrwl/devkit';
import { Linter, lintProjectGenerator } from '@nrwl/linter';
import { getRootTsConfigPath } from 'nx/src/utils/typescript';
import * as path from 'path';
import { workerInit } from '../init/init';
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
  const projectRoot = `${getWorkspaceLayout(tree).appsDir}/${projectDirectory}`;
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
  const { npmScope } = getWorkspaceLayout(tree);
  const templateOptions = {
    ...options,
    ...n,
    rootTsConfigPath: getRootTsConfigPath(),
    importPath: `@${npmScope}/${options.projectDirectory}`,
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
}

function addProject(tree: Tree, options: NormalizedSchema) {
  addProjectConfiguration(
    tree,
    options.projectName,
    {
      root: options.projectRoot,
      tags: options.parsedTags,
      projectType: 'application',
      sourceRoot: `${options.projectRoot}/src`,
      targets: {
        // wrangler cli can handle ts code
        // build: {
        //   executor: '@nrwl/js:tsc',
        //   outputs: ['{options.outputPath}'],
        //   options: {
        //     outputPath: `dist/${options.projectRoot}`,
        //     main: `${options.projectRoot}/src/index.ts`,
        //     tsConfig: `${options.projectRoot}/tsconfig.app.json`,
        //     assets: [`${options.projectRoot}/*.md`],
        //   },
        // },
        serve: {
          executor: '@nrwl/workspace:run-commands',
          options: {
            commands: [
              'npx wrangler dev src/index.ts --tsconfig=tsconfig.app.json --env=dev',
            ],
            cwd: options.projectRoot,
          },
          configurations: {
            production: {
              commands: [
                'npx wrangler dev src/index.ts --tsconfig=tsconfig.app.json --env=production',
              ],
            },
          },
        },
        publish: {
          executor: '@nrwl/workspace:run-commands',
          options: {
            commands: [
              `npx wrangler publish src/index.ts --tsconfig=tsconfig.app.json --env=dev`,
            ],
            cwd: options.projectRoot,
          },
          configurations: {
            production: {
              commands: [
                `npx wrangler publish src/index.ts --tsconfig=tsconfig.app.json --env=production`,
              ],
            },
          },
        },
      },
    },
    true
  );
}

export function addLint(
  tree: Tree,
  options: NormalizedSchema
): Promise<GeneratorCallback> {
  return lintProjectGenerator(tree, {
    project: options.projectName,
    linter: Linter.EsLint,
    skipFormat: true,
    tsConfigPaths: [
      joinPathFragments(options.projectRoot, 'tsconfig.app.json'),
    ],
    eslintFilePatterns: [`${options.projectRoot}/**/*.ts`],
  });
}

export async function workerApp(
  tree: Tree,
  options: CloudflareWorkersGeneratorSchema
) {
  const normalizedOptions = normalizeOptions(tree, options);
  const cfWorkerInitTask = workerInit(tree);

  addFiles(tree, normalizedOptions);
  addProject(tree, normalizedOptions);
  const lintTask = await addLint(tree, normalizedOptions);

  return () => {
    lintTask();
    formatFiles(tree);
    cfWorkerInitTask();
  };
}

export default workerApp;

interface TsConfig {
  include?: string[];
  compilerOptions?: Record<string, unknown>;
}
