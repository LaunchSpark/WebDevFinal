const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const cacheRoot = path.join(root, '.cache');
const cacheHome = path.join(cacheRoot, 'home');
const env = {
  ...process.env,
  HOME: cacheHome,
  USERPROFILE: cacheHome,
  ELECTRON_BUILDER_CACHE: path.join(cacheRoot, 'electron-builder'),
  ELECTRON_CACHE: path.join(cacheRoot, 'electron'),
  npm_config_cache: path.join(cacheRoot, 'npm'),
  npm_config_devdir: path.join(cacheRoot, 'electron-gyp')
};

for (const dir of [
  env.ELECTRON_BUILDER_CACHE,
  env.ELECTRON_CACHE,
  env.npm_config_cache,
  env.npm_config_devdir,
  cacheHome
]) {
  fs.mkdirSync(dir, { recursive: true });
}

const cliPath = require.resolve('electron-builder/out/cli/cli');
const result = spawnSync(process.execPath, [cliPath, ...process.argv.slice(2)], {
  cwd: root,
  env,
  stdio: 'inherit'
});

if (result.error) throw result.error;
process.exit(result.status ?? 0);
