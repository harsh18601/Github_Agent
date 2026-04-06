import fs from 'fs';
import path from 'path';

const CONFIG_FILE = '.github-agent.json';

function readPackageScripts(cwd = process.cwd()) {
  const packageJsonPath = path.join(cwd, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    return {};
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.scripts || {};
  } catch {
    return {};
  }
}

export function getConfigPath(cwd = process.cwd()) {
  return path.join(cwd, CONFIG_FILE);
}

export function getDefaultConfig(cwd = process.cwd()) {
  const scripts = readPackageScripts(cwd);

  return {
    lintCommand: scripts.lint ? 'npm run lint' : null,
    testCommand: scripts.test ? 'npm test' : null,
    watch: {
      batchTimeout: 5000,
      ignored: [],
    },
  };
}

export function loadConfig(cwd = process.cwd()) {
  const defaults = getDefaultConfig(cwd);
  const configPath = getConfigPath(cwd);

  if (!fs.existsSync(configPath)) {
    return defaults;
  }

  try {
    const rawConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return {
      ...defaults,
      ...rawConfig,
      watch: {
        ...defaults.watch,
        ...(rawConfig.watch || {}),
      },
    };
  } catch {
    return defaults;
  }
}

export function initializeConfig(cwd = process.cwd()) {
  const configPath = getConfigPath(cwd);

  if (fs.existsSync(configPath)) {
    return { created: false, path: configPath };
  }

  const config = getDefaultConfig(cwd);
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  return { created: true, path: configPath };
}
