let socket = require('socket.io-client');
let config = require('./config');

import {System} from './system';
import * as q from 'q';

export class Socket {
  private socket: any;
  constructor(private system: System) {
    this.connectSocket();
  }
  
  /**
   * connects to the control websocket to receive commands
   */
  connectSocket() {
    this.socket = socket('http://localhost:' + config.SysComPort);
    this.registerApi();
  }
  
  /**
   * register handlers for all API calls
   */
  registerApi() {
    //start of all plugins
    this.socket.on('start', () => {
      this.system.start();
    });
    console.log('registered');
    //start of a specfic plugin
    this.socket.on('startPlugin', (plugin: string) => {
      this.system.startPlugin(plugin);
    });
  }
}
