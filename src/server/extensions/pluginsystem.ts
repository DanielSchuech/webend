import TinyDiInjectable from '../tinydiinjectable';
import * as child_process from 'child_process';
import DependencyManager from './depmanager';
import * as path from 'path';
import * as express from 'express';
import * as http from 'http';
import * as socket from 'socket.io';

export default class PluginSystem extends TinyDiInjectable{
  private child: child_process.ChildProcess;
  constructor(private depManager: DependencyManager, private config:any) {
    super();
    
    this.createSocket();
    this.start();
  }
  
  start() {
    let file = path.normalize(__dirname + '/../../pluginsystem/system.js');
    //this.child = child_process.spawn('node', [file]);
  }
  
  createSocket() {
    let app = express();
    let server = (<any>http).Server(app);
    let io = socket(server);
    
    io.on('connection', function(socket: SocketIO.Socket){
      this.initialiseRequests(socket);
    }.bind(this));
    
    server.listen(this.config.server.SysComPort, () => {});
  }
  
  /**
   * the connected device could request some ressources
   * initialise the events with handlers
   */
  initialiseRequests(socket: SocketIO.Socket) {
    //request needed webend plugin dependencies
    socket.on('dependencies', () => {
      if (this.depManager.isInitialised()) {
        socket.emit('dependencies', this.depManager.getPlugins());
      } else {
        this.depManager.initialise().then((deps: any) => {
          socket.emit('dependencies', deps);
        });
      }
    });
  }
}
PluginSystem.$inject = {
  deps: ['depManager', 'config'],
  callAs: 'class'
}
