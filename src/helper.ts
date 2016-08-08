import * as path from 'path';
import * as fs from 'fs';

export function getGlobalConfig() {
  try {
    return require(path.resolve(process.cwd() + '/config.json'));
  } catch (e1) {
    try {
      return require('./config.json');
    } catch (e2) {
      throw Error('Global Config not found!');
    }
  }
}

export function getPluginConfigPath() {
  let p = path.resolve(process.cwd() + '/pluginconfig.json');
  if (fs.existsSync(p)) {
    return p;
  } else {
    return path.normalize(__dirname + '/pluginsystem/config.json');
  }
}

export function getPluginConfig() {
  return require(getPluginConfigPath());
}
