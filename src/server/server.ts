import Injector = require('tiny-di');
import * as path from 'path';
import * as express from 'express';
import * as http from 'http';

export class Daemon {
  private injector: TinyDiInjector;
  private server: express.Express;
  
  constructor(private logger: Function, private config: any) {
    //Prepare dependency injection
    this.injector = new Injector();
    this.injector.bind('injector').to(this.injector);
    this.injector.setResolver(this.dependencyResolver);
    
    //create express server
    this.server = express();
    
    //link injected variables
    this.injector
      .bind('config').to(config)
      .bind('server').to(this.server)
      .bind('logger').to(this.logger);
      
    //load extensions and modules
    this.loadExtensions();
    this.loadModules();
    
    this.runServer();
  }
  
  dependencyResolver(moduleId: string) {
    var modulePath = path.join(__dirname, moduleId);
    try {
      return require(modulePath).default;
    } catch (e) {
      try {
        return require(moduleId).default;
      } catch (e2) {
        this.logger('Extension ' + moduleId + ' failed to load');
        this.logger(modulePath);
        this.logger('errors', e, e2);
        this.logger(new Error().stack);
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
  
  runServer() {
    var s = http.createServer(this.server);
    s.on('error', function(err: any) {
      if (err.code === 'EADDRINUSE') {
        this.logger('Development server is already started at port ' + 
          this.config.server.port);
      } else {
        throw err;
      }
    }.bind(this));
    
    s.listen(this.config.server.port);
    this.logger('Server startet at port ' + this.config.server.port);
  }
}
