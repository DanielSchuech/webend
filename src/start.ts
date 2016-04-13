import {Daemon} from './server/server';

let serverconf: any;
try {
  serverconf = require(__dirname + '/config.json');
} catch (e1) {
  try {
    serverconf = require(__dirname + '/plugin_system/server/config.json');
  } catch (e2) {
    console.error('Config not found');
    console.error('Exiting...');
    process.exit(1);
  }
}

serverconf.dist = {
  'root': process.argv[2] || './'
};

new Daemon(console.log, serverconf);