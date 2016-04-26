import * as q from 'q';
import * as child_process from 'child_process';

let config = require('../config.json');

/**
 * The dependency manager will hold all dependencies to webend plugins
 */
export class DependencyManager {
  private plugins: any = {};
  private initialised: boolean = false;
   
  constructor() {}
  
  isInitialised() {
    return this.initialised;
  }
  
  /**
   * the dep manager will scann all dependencies
   */
  initialise() {
    this.initialised = false;
    let deffered = q.defer();
    //Buffer max size: 10mb
    child_process.exec('npm ls --json --long',
      {maxBuffer: 1024 * 10000}, processNpmList.bind(this));
    
    function processNpmList(error: Error, stdout: string, stderr: string) {
      if (error || stderr) {
        if (stderr && stderr.indexOf('npm ERR! extraneous:') > -1) {
          console.log('Warning: extraneous package!');
          console.log(stderr);
        } else {
          console.log('Error on searching for plugins: ' + error + stderr);
          return deffered.reject('Error on searching for plugins: ' + error + stderr);
        }        
      }
      let plugins = JSON.parse(stdout).dependencies;
      this.plugins = 
        DependencyManager.filterDependencies(plugins, '^' + config.pluginPrefix);
      
      this.initialised = true;
      deffered.resolve(this.plugins);
    }
    
    return deffered.promise;
  }
  
  /**
   * filters the plugin dependencies with the configured prefix out of the all packages
   */
  static filterDependencies(json: any, regexString: string) {
    if (!json || json === {}) {
      return {};
    }
    let pattern = new RegExp(regexString);
    let returnJson: any = {};
    let keys = Object.keys(json);
    keys.forEach(function(entry) {
      if (pattern.test(entry)) {
        returnJson[entry] = json[entry];
        returnJson[entry].dependencies = 
          DependencyManager.filterDependencies(returnJson[entry].dependencies, regexString);
      }
    });
    
    return returnJson;
  }
  
  /**
   * only available if already initialised
   * otherwise returns {}
   */
  getPlugins() {
    return this.plugins;
  }
}
