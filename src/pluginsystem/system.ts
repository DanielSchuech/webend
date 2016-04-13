import {DependencyManager} from './depmanager';
import Injector = require('tiny-di');
import * as path from 'path';

import {Socket} from './socket';

let config = require('./config');

export class System {
  private socket: Socket;
  private status: {[name: string]: boolean};
  private depManager: DependencyManager;
  private pluginInjector: Injector;
  
  constructor() {
    this.depManager = new DependencyManager();
    this.socket = new Socket(this);
  }
  
  /**
   * starts all in config activated plugins
   */
  start() {
    this.pluginInjector = new Injector();
    this.pluginInjector.bind('injector').to(this.pluginInjector);
    this.pluginInjector.bind('status').to(this.status);
    this.pluginInjector.setResolver(this.dependencyResolver);
    
    console.log('Starting plugins........');
    if (!this.depManager.isInitialised()) {
      this.depManager.initialise().then(this.loadPlugins)
    } else {
      this.loadPlugins(this.depManager.getPlugins());
    }
  }
  
  /**
   * loads all plugins given as dependencies
   */
  loadPlugins(deps: any) {
    let keys = Object.keys(deps);
    keys.forEach(function(plugin) {
      //only start plugins which are enabled
      if (config.plugins[plugin]) {
        this.startPlugin(plugin);
      } else {
        this.status[plugin] = false;
      }
      
    });
  }
  
  /**
   * start the given plugin
   * dependencies will be started at first
   */
  startPlugin(plugin: string) {
    //check and load dependencies for plugin
    let dependencies = this.depManager.getPlugins();
    let depsLoaded = this.loadDependencies(dependencies[plugin].dependencies, plugin);
    if (!depsLoaded) {
      //dependencies not load -> cant start plugin
      console.log('Dependencies coudnt be loaded for ' + plugin);
      this.status[plugin] = false;
      return false;
    }
    
    console.log('Starting ' + plugin + ' ...');
    
    try {
      /**
       * frontend only plugin(no main attribute in package.json) 
       * cannot be required in backend
       */
      if (!dependencies[plugin].main) {
        this.status[plugin] = true;
        return true;
      }
      
      //load and start plugin
      let module = this.pluginInjector.bind(plugin).load(plugin);
      module.start(pluginConfigs[plugin]);
      
      this.status[plugin] = true;
      return true;
    } catch (e) {
      console.log('Could not load plugin: ' + plugin);
      console.log(e);
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
          console.log('Plugin ' + plugin + 'requires dependency ' + key + 
            'which couldnt be loaded or is deactivated -> activate it!');
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
    var modulePath = path.join(__dirname, moduleId);
    try {
      return commonOrDefaultExport(require(modulePath));
    } catch (e) {
      try {
        return commonOrDefaultExport(require(moduleId));
      } catch (e2) {
        console.log('Plugin ' + moduleId + ' failed to load');
        console.log(modulePath);
        console.log('errors', e, e2);
        console.log(new Error().stack);
        return false;
      }
    }
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
