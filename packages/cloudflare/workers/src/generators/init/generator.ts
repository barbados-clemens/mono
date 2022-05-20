import {
  addDependenciesToPackageJson,
  Tree,
} from '@nrwl/devkit';

export function workerInit(tree: Tree) {
  const installTask = addDependenciesToPackageJson(tree, {tslib: '^2.4.0'}, {
    "@nrwl/js": "14.1.7",
    "wrangler": "^2.0.2",
    "@cloudflare/workers-types": "^3.10.0"
  })

  return () => {
    installTask();
  }
}

export default workerInit;
