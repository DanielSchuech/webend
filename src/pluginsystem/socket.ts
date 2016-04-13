let socket = require('socket.io-client');
let config = require('./config');

import * as q from 'q';

export class Socket {
  private socket: any;
  constructor() {
    this.connectSocket();
  }
  
  /**
   * connects to the control websocket to receive commands
   */
  connectSocket() {
    this.socket = socket('http://localhost:' + config.SysComPort);
  }
  
  requestDeps() {
    let deffered = q.defer();
    //register event listener
    this.socket.on('dependencies', (data: any) => {
      deffered.resolve(data);
      
      //remove Listener after success
      this.socket.off('dependencies');
    });
    //request ressource
    this.socket.emit('dependencies');
    
    return deffered.promise;
  }
}
