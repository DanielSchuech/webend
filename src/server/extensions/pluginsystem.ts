import TinyDiInjectable from '../tinydiinjectable';
import * as child_process from 'child_process';
import * as path from 'path';
import * as express from 'express';
import * as http from 'http';
import * as socket from 'socket.io';

export default class PluginSystem extends TinyDiInjectable{
  private child: child_process.ChildProcess;
  constructor(private config:any) {
    super();
    
    this.createSocket();
    this.start();
  }
  
  start() {
    let file = path.normalize(__dirname + '/../../pluginsystem/system.js');
    //this.child = child_process.spawn('node', [file]);
  }
  
  /**
   * create a websocket
   * the pluginsystem will connect at startup
   */
  createSocket() {
    let app = express();
    let server = (<any>http).Server(app);
    let io = socket(server);
    
    io.on('connection', function(socket: SocketIO.Socket){
      console.log('pluginsystem connected');
      console.log('emit')
      io.emit('startPlugin', 'webend');
    });
    
    server.listen(this.config.server.SysComPort, () => {});
  }
}
PluginSystem.$inject = {
  deps: ['config'],
  callAs: 'class'
}
