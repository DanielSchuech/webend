import TinyDiInjectable from '../tinydiinjectable';
import * as child_process from 'child_process';
import * as path from 'path';
import * as express from 'express';
import * as http from 'http';
import * as socket from 'socket.io';
import {Logger} from '../logger';

export default class PluginSystem extends TinyDiInjectable{
  private child: child_process.ChildProcess;
  private pluginStatus: {[name: string]: boolean};
  private systemSocket: SocketIO.Server;
  
  constructor(private config:any, private logger: Logger, 
      private websocket: SocketIO.Server) {
    super();
    
    websocket.on('connection', (client) => {
      this.registerWebsocketRoutes(client);
    });
    
    this.createSocket();
    this.start();
  }
  
  /**
   * create a websocket
   * the pluginsystem will connect at startup
   */
  createSocket() {
    let app = express();
    let server = (<any>http).Server(app);
    this.systemSocket = socket(server);
    
    this.systemSocket.on('connection', (socket: SocketIO.Socket) => {
      /**
       * listener for changed status of any plugin
       * broadcast to all clients
       */
      socket.on('changedStatus', (data: {[name: string]: boolean}) => {
        this.pluginStatus = data;
        this.websocket.emit('pluginStatus', data);
      });
    });
    
    server.listen(this.config.server.SysComPort, () => {});
  }
  
  /**
   * starts the plugin system in a new process
   */
  start() {
    this.logger.log('Starting Plugin System.............');
    let file = path.normalize(__dirname + '/../../pluginsystem/system.js');
    this.child = child_process.spawn('node', [file]);
    this.child.stdout.on('data', (data: any) => {this.logger.log(`${data}`)});
    this.child.stderr.on('data', (data: any) => {this.logger.log(`${data}`)});
  }
  
  
  
  /**
   * stops the plugin system -> kill the process
   */
  stop() {
    //reset status of webend plugin status
    this.resetAllPluginStatus();
    this.websocket.emit('pluginStatus', this.pluginStatus);
    
    this.logger.log('Stopping Plugin System.............');
    this.child.kill();
  }
  
  /**
   * restarts the plugin system
   */
  restart() {
    this.logger.log('Restarting Plugin System...........');
    this.stop();
    this.start();
  }
  
  /**
   * register websocket routes for plugin system -> start, stop, restart,
   * get status of all plugins
   */
  registerWebsocketRoutes(client: SocketIO.Socket) {
    client.on('startPluginSystem', this.start.bind(this));
    client.on('stopPluginSystem', this.stop.bind(this));
    client.on('restartPluginSystem', this.restart.bind(this));
    
    client.on('pluginStatus', () => {
      client.emit('pluginStatus', this.pluginStatus);
    });
    
    client.on('startPlugin', (plugin: string) => {
      this.systemSocket.emit('startPlugin', plugin);
    });
  }
  
  resetAllPluginStatus() {
    let keys = Object.keys(this.pluginStatus);
    keys.forEach((key) => {
      this.pluginStatus[key] = false;
    });
  }
}
PluginSystem.$inject = {
  deps: ['config', 'logger', 'websocket'],
  callAs: 'class'
}
