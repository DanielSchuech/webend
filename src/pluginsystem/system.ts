import Injector = require('tiny-di');
import * as path from 'path';

import {Socket} from './socket';

class System {
  private socket: Socket;
  private status: {[name: string]: boolean};
  
  constructor() {
    this.socket = new Socket();
    this.socket.requestDeps();
    setTimeout(() => {
      this.socket.requestDeps();
    },2000);
  }
  
  /**
   * starts all activated plugins
   */
  start() {
    let pluginInjector = new Injector();
    pluginInjector.bind('injector').to(pluginInjector);
    pluginInjector.bind('status').to(this.status);
    pluginInjector.setResolver(this.dependencyResolver);
    
    console.log('Starting plugins........');
  }
  
  dependencyResolver(moduleId: string) {
    var modulePath = path.join(__dirname, moduleId);
    try {
      return require(modulePath).default;
    } catch (e) {
      try {
        return require(moduleId).default;
      } catch (e2) {
        console.log('Plugin ' + moduleId + ' failed to load');
        console.log(modulePath);
        console.log('errors', e, e2);
        console.log(new Error().stack);
        return false;
      }
    }
  }
  
  
}

new System();
