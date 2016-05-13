import {DependencyManager} from './depmanager';
import Injector = require('tiny-di');
import * as path from 'path';

import {Socket} from './socket';

let config = require('./config');

export class System {
  private socket: Socket;
  private status: {[name: string]: boolean} = {};
  private depManager: DependencyManager;
  private pluginInjector: Injector;
  private manualStartListener: Function[] = [];
  
  constructor() {
    this.depManager = new DependencyManager();
    this.socket = new Socket(this);
    this.start();
  }
  
  /**
   * starts all in config activated plugins
   */
  start() {
    this.pluginInjector = new Injector();
    this.pluginInjector.bind('injector').to(this.pluginInjector);
    this.pluginInjector.bind('status').to(this.status);
    this.pluginInjector.bind('config').to(config.plugins);
    this.pluginInjector.bind('autostart').to(config.enabled);
    this.pluginInjector.bind('addManualStartListener')
      .to(this.addManualStartListener.bind(this));
    this.pluginInjector.setResolver(this.dependencyResolver);
    
    
    console.log('Starting plugins........');
    if (!this.depManager.isInitialised()) {
      this.depManager.initialise().then(this.loadPlugins.bind(this));
    } else {
      this.loadPlugins(this.depManager.getPlugins());
    }
  }
  
  /**
   * loads all plugins given as dependencies
   */
  loadPlugins(deps: any) {
    //bind deps for pluginSystem
    this.pluginInjector.bind('dependencies').to(deps);
    
    //plugins are not loaded but system is ready!
    this.changePluginStatus('webend', true);
    
    let keys = Object.keys(deps);
    keys.forEach((plugin: string) => {
      //only start plugins which are enabled
      if (config.enabled[plugin]) {
        this.startPlugin(plugin);
      } else {
        this.changePluginStatus(plugin, false);
      }
      
    });
  }
  
  /**
   * start the given plugin
   * dependencies will be started at first
   */
  startPlugin(plugin: string) {
    //system not started -> cannot start plugin
    if (!this.status['webend']) {
      console.log('System not started -> Couldn\'t start Plugin ' + plugin);
      this.changePluginStatus(plugin, false);
      return false;
    }
    
    //check and load dependencies for plugin
    let dependencies = this.depManager.getPlugins();
    let depsLoaded = this.loadDependencies(dependencies[plugin].dependencies, plugin);
    if (!depsLoaded) {
      //dependencies not load -> cant start plugin
      console.log('Dependencies coudn\'t be loaded for ' + plugin);
      this.changePluginStatus(plugin, false);
      return false;
    }
    
    console.log('Starting ' + plugin + ' ...');
    
    try {
      /**
       * frontend only plugin(no main attribute in package.json) 
       * cannot be required in backend
       */
      if (!dependencies[plugin].main && !dependencies[plugin].missing) {
        this.changePluginStatus(plugin, true);
        return true;
      }
      
      //load and start plugin
      let module = this.pluginInjector.bind(plugin).load(plugin);
      
      if (!module) {
        this.changePluginStatus(plugin, false);
        return false;
      } else {
        if (module.start) {
          module.start();
        }
        
        this.changePluginStatus(plugin, true);
        return true;
      }
    } catch (e) {
      this.changePluginStatus(plugin, false);
      console.log('Could not load plugin: ' + plugin);
      console.log(e);
      console.log(e.stack);
      return false;
    }
    
  }
  
  /**
   * loads all required dependencies of a plugin
   */
  loadDependencies(dependencies: any, plugin: string) {
    if (!dependencies || dependencies === {} ) {
      return true;
    }
    
    let allPluginsLoaded = true;
    let keys = Object.keys(dependencies);
    keys.forEach((key) => {
      if (this.status[key] === undefined) {
        let keyLoaded = this.startPlugin(key);
        if (!keyLoaded) {
          allPluginsLoaded = false;
        }
      } else {
        // plugin has already tried to start or is disabled in config
        if (!this.status[key]) {
          console.log('Plugin ' + plugin + ' requires dependency ' + key + 
            ' which couldnt be loaded or is deactivated -> activate it!');
          allPluginsLoaded = false;
        }
      }
    });
    return allPluginsLoaded;
  }
  
  /**
   * dependency resolver for tiny di injector
   * loads always the default part
   *  -> can only resolve classes which are exported as default
   */
  dependencyResolver(moduleId: string) {
    try {
      return commonOrDefaultExport(require(moduleId));
    } catch (e2) {
      console.log('Plugin ' + moduleId + ' failed to load');
      console.log('errors', e2);
      console.log(new Error().stack);
      return false;
    }
  }
  
  /** 
   * set the status of a plugin
   * the control system will be informed via socket
   */
  changePluginStatus(plugin: string, status: boolean) {
    this.status[plugin] = status;
    this.socket.changedStatus(this.status);
  }
  
  /**
   * manually start of an plugin thourgh an event received by the socket
   * start plugin and inform plugins
   */
  manualStart(plugin: string) {
    this.startPlugin(plugin);
    this.manualStartListener.forEach((fn) => {
      fn(plugin);
    });
  }
  
  addManualStartListener(fn: Function) {
    this.manualStartListener.push(fn);
  }
  
}

/**
 * commonjs exports function to main attribute of the file -> module.exports
 * es6 & typescript uses default export -> module.exports.default
 * check which type is used and return module
 */
function commonOrDefaultExport(module: any) {
  if (module instanceof Function) {
    return module;
  }
  return module.default;
}

new System();
