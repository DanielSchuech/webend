import TinyDiInjectable from '../tinydiinjectable';
import {Logger} from '../logger';
import PluginSystem from '../extensions/pluginsystem'
import * as child_process from 'child_process';

import {DependencyManager} from '../../pluginsystem/depmanager';

export default class Installation extends TinyDiInjectable {
  constructor(private websocket: SocketIO.Server, private logger: Logger,
      private pluginSystem: PluginSystem, private depManager: DependencyManager) {
    super();
    
    websocket.on('connection', (socket) => {
      socket.on('install', this.installListener.bind(this));
    });
  }
  
  /**
   * websocket listener
   */
  installListener(npmPackage: string) {
    //TODO: some more filtering for security
    //Disable &&
    if (npmPackage.indexOf('&&') > -1) {
      this.logger.log('Its not allowed to use && for security reasons!');
      return;
    }
    
    let params = npmPackage.split(' ');
    params.unshift('install');
    params.unshift('--save');
    
    //spawn ignores PATHEXT on windows -> use cmd
    //https://github.com/nodejs/node-v0.x-archive/issues/2318
    let options: any = {};
    if (process.platform === 'win32') {
      options.shell = true;
    }
    
    let child = child_process.spawn('npm', params, options);
    child.stdout.on('data', (data: any) => {this.logger.log(`${data}`)});
    child.stderr.on('data', (data: any) => {this.logger.log(`${data}`)});
    
    child.on('close', (code: number) => {
      if (code === 0) {
        //Installation successful
        this.logger.log(`Installation of ${npmPackage} succesfully completed`);
        this.pluginSystem.restart();
        this.depManager.initialise();
      } else {
        //Installation failed
        this.logger.log(`Installation failed with Error Code: ${code}`);
      }
    });
  }
}
Installation.$inject = {
  deps: ['websocket', 'logger', 'pluginSystem', 'depManager'],
  callAs: 'class'
};
