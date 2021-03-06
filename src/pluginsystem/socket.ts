import * as path from 'path';
let socket = require('socket.io-client');
import {getGlobalConfig} from '../helper';

let config = getGlobalConfig();

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
    this.socket = socket('http://localhost:' + config.server.SysComPort);
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
    
    //start of a specfic plugin
    this.socket.on('startPlugin', (plugin: string) => {
      this.system.manualStart(plugin);
    });
  }
  
  /**
   * changed the status of an plugin
   * inform control system
   */
  changedStatus(allStatus: any) {
    this.socket.emit('changedStatus', allStatus);
  }
}
