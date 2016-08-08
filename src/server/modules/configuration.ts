import TinyDiInjectable from '../tinydiinjectable';
import * as fs from 'q-io/fs';
import * as path from 'path';
import {Logger} from '../logger';
import PluginSystem from '../extensions/pluginsystem';
import {getPluginConfigPath} from '../../helper';

import {DependencyManager} from '../../pluginsystem/depmanager';

let configFile = getPluginConfigPath();

export default class Configuration extends TinyDiInjectable {
  
  constructor(private logger: Logger, private websocket: SocketIO.Server, 
      pluginSystem: PluginSystem, private depManager: DependencyManager) {
    super();
    this.depManager.initialise();
    
    websocket.on('connection', (socket) => {
      //send values for autostart and deps for each plugin
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
      
      //request plugin information + configuration
      socket.on('getPluginConfig', (plugin: string) => {
        this.collectPluginConfigData(plugin).then((data: any) => {
          socket.emit('getPluginConfig', data);
        });
      });
      
      //save plugin configuration
      socket.on('savePluginConfig', (plugin: string, config: any) => {
        this.savePluginConfig(plugin, config).then(() => {
          pluginSystem.restart();
          //send new config
          this.collectPluginConfigData(plugin).then((data: any) => {
            socket.emit('getPluginConfig', data);
          });
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
    return fs.read(configFile).then((data: any) => {return JSON.parse(data); }, 
      (err: any) => {
        this.logger.log('Error on reading Config File!');
        this.logger.log(err);
      });
  }
  
  writeConfigFile(config: any) {
    return fs.write(configFile, JSON.stringify(config, null , 2)).then(
      (data: any) => {return data; }, 
      (err: any) => {
        this.logger.log('Error on writing Config File!');
        this.logger.log(err);
      });
  }
  
  collectPluginConfigData(plugin: string) {
    if (this.depManager.isInitialised()) {
      return combineInfoAndConfig.bind(this)(this.depManager.getPlugins());
    } else {
      return this.depManager.initialise().then(combineInfoAndConfig.bind(this));
    }
    
    function combineInfoAndConfig(deps: any) {
      return this.readConfigFile().then((config: any) => {
        return {
          info: deps[plugin],
          config: config.plugins[plugin]
        };
      });
    }
  }
  
  savePluginConfig(plugin: string, pluginConfig: any) {
    return this.readConfigFile().then((config: any) => {
      config.plugins[plugin] = pluginConfig;
      return this.writeConfigFile(config);
    });
  }
}
Configuration.$inject = {
  deps: ['logger', 'websocket', 'pluginSystem', 'depManager'],
  callAs: 'class'
};
