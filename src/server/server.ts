import Injector = require('tiny-di');
import * as path from 'path';
import * as express from 'express';
import * as http from 'http';
import {Logger} from './logger';
import * as io from 'socket.io';
import * as bodyParser from 'body-parser';
import * as fs from 'fs';

import {DependencyManager} from '../pluginsystem/depmanager';

let socketioJwt = require('socketio-jwt');

export class Daemon {
  private injector: TinyDiInjector;
  private server: express.Express;
  private logger: Logger;
  private httpServer: http.Server;
  
  constructor(usrLogger: Function, private config: any) {
    //create logger
    this.logger = new Logger();
    this.logger.addListener(usrLogger);
    
    //Prepare dependency injection
    this.injector = new Injector();
    this.injector.bind('injector').to(this.injector);
    this.injector.setResolver(this.dependencyResolver.bind(this));
    
    //create express server
    this.server = express();
    this.server.use(bodyParser.json());
    this.server.use(bodyParser.urlencoded({ extended: true }));
    this.httpServer = this.createServer();
    let webSocket = io(this.httpServer);
    webSocket.use(socketioJwt.authorize({
      secret: fs.readFileSync(config.privateKeyPath, 'utf8'),
      handshake: true
    }));
    
    
    //create DependencyManager
    let depManager = new DependencyManager();
    
    //link injected variables
    this.injector
      .bind('config').to(config)
      .bind('server').to(this.server)
      .bind('logger').to(this.logger)
      .bind('websocket').to(webSocket)
      .bind('depManager').to(depManager);
      
    //load extensions and modules
    this.loadExtensions();
    this.loadModules();
    
    //start Server
    this.httpServer.listen(this.config.server.port);
    this.logger.log('Server startet at port ' + this.config.server.port);
  }
  
  dependencyResolver(moduleId: string) {
    var modulePath = path.join(__dirname, moduleId);
    try {
      return require(modulePath).default;
    } catch (e) {
      try {
        return require(moduleId).default;
      } catch (e2) {
        this.logger.log('Extension ' + moduleId + ' failed to load');
        this.logger.log(modulePath);
        this.logger.log('errors' + e + e2);
        this.logger.log(new Error().stack);
        return false;
      }
    }
  }
  
  loadModules() {
    this.config.server.modules.forEach((module: any) => {
      let file: string = module.file || module.module;
      this.injector.bind(module.module).load(file);
    });
  }

  loadExtensions() {
    this.config.server.extensions.forEach((extension: any) => {
      let file: string = extension.file || extension.extension;
      this.injector.bind(extension.extension).load(file);
    });
  }
  
  createServer() {
    var s = http.createServer(this.server);
    s.on('error', function(err: any) {
      if (err.code === 'EADDRINUSE') {
        this.logger.log('Development server is already started at port ' + 
          this.config.server.port);
      } else {
        throw err;
      }
    }.bind(this));
    return s;
  }
}
