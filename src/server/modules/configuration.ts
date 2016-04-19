import TinyDiInjectable from '../tinydiinjectable';
import * as express from 'express';
import * as fs from 'q-io/fs';
import *as path from 'path';
import {Logger} from '../logger';
import PluginSystem from '../extensions/pluginsystem'

import {DependencyManager} from '../../pluginsystem/depmanager';

let configFile = path.normalize(__dirname + '/../../pluginsystem/config.json');

export default class Configuration extends TinyDiInjectable {
  private depManager: DependencyManager;
  
  constructor(server: express.Express, private logger: Logger,
      private websocket: SocketIO.Server, pluginSystem: PluginSystem) {
    super();
    this.depManager = new DependencyManager();
    this.depManager.initialise();
    
    websocket.on('connection', (socket) => {
      socket.on('getPluginMetadata', () => {
        this.sendMetadata(socket);
      });
      
      //save changed autostart settings
      socket.on('saveAutostart', (autostart: {[name: string]: boolean}) => {
        this.writeAutostartConfigToFile(autostart).then(() => {
          this.sendMetadata(socket);
          pluginSystem.restart();
        });
      });
    });
    
  }
  
  /**
   * send collected metadata to given websocket
   */
  sendMetadata(client: SocketIO.Socket) {
    this.collectPluginsData().then((data: any) => {
      client.emit('getPluginMetadata', data);
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
          enabled: config.enabled
        };
      });
    }
  }
  
  writeAutostartConfigToFile(data: any) {
    return this.readConfigFile().then((config: any) => {
      config.enabled = data;
      return this.writeConfigFile(config);
    });
  }
  
  readConfigFile() {
    return fs.read(configFile).then((data: any) => {return JSON.parse(data);}, 
      (err: any) => {
        this.logger.log('Error on reading Config File!');
        this.logger.log(err);
      });
  }
  
  writeConfigFile(config: any) {
    return fs.write(configFile, JSON.stringify(config, null , 2)).then(
      (data: any) => {return data;}, 
      (err: any) => {
        this.logger.log('Error on writing Config File!');
        this.logger.log(err);
      });
  }
}
Configuration.$inject = {
  deps: ['server', 'logger', 'websocket', 'pluginSystem'],
  callAs: 'class'
}
