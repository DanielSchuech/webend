import TinyDiInjectable from '../tinydiinjectable';
import * as express from 'express';
import * as fs from 'q-io/fs';
import *as path from 'path';
import {Logger} from '../logger';

import {DependencyManager} from '../../pluginsystem/depmanager';

let configFile = path.normalize(__dirname + '/../../pluginsystem/config.json');

export default class Configuration extends TinyDiInjectable {
  private depManager: DependencyManager;
  
  constructor(server: express.Express, private logger: Logger,
      private websocket: SocketIO.Server) {
    super();
    this.depManager = new DependencyManager();
    this.depManager.initialise();
    
    websocket.on('connection', (socket) => {
      socket.on('getPluginMetadata', () => {
        this.collectPluginsData().then((data: any) => {
          socket.emit('getPluginMetadata', data);
        })
      });
    });
    
    //TODO check authentification
    server.post('plugins/configure/enabled', (req, res) => {
      let data = req.body;
      console.log(data);
      this.writeEnabledConfigToFile(data).then(() => {
        res.sendStatus(200);
      }, () => {
        res.sendStatus(400);
      });
    });
  }
  
  /**
   * collects configuration and dependencies for all plugins
   */
  collectPluginsData() {
    if (this.depManager.isInitialised()) {
      return addEnabledConfig.bind(this)(this.depManager.getPlugins());
    } else {
      return this.depManager.initialise().then(addEnabledConfig.bind(this));
    }
    
    function addEnabledConfig(deps: any) {
      return this.readConfigFile().then((config: any) => {
        return {
          deps: deps,
          enabled: JSON.parse(config).enabled
        };
      });
    }
  }
  
  writeEnabledConfigToFile(data: any) {
    return this.readConfigFile().then((config: any) => {
      config.enabled = data;
      return this.writeConfigFile(config);
    });
  }
  
  readConfigFile() {
    return fs.read(configFile).then((data: any) => {return data;}, (err: any) => {
      this.logger.log('Error on reading Config File!');
    });
  }
  
  writeConfigFile(config: any) {
    return fs.write(configFile, config).then((data: any) => {return data;}, (err: any) => {
      this.logger.log('Error on writing Config File!');
    });
  }
}
Configuration.$inject = {
  deps: ['server', 'logger', 'websocket'],
  callAs: 'class'
}
