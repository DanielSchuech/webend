import TinyDiInjectable from '../tinydiinjectable';
import * as q from 'q';
import * as child_process from 'child_process';

/**
 * The dependency manager will hold all dependencies to webend plugins
 */
export default class DependencyManager extends TinyDiInjectable{
  private plugins: any = {};
  private initialised: boolean = false;
   
  constructor(private config: any, private logger: Function) {
    super();
  }
  isInitialised() {
    return this.initialised;
  }
  
  /**
   * the dep manager will scann all dependencies
   */
  initialise() {
    let deffered = q.defer();
    //Buffer max size: 10mb
    var child = child_process.exec("npm ls --json --long", 
      {maxBuffer: 1024 * 10000}, processNpmList.bind(this));
    
    function processNpmList(error: Error, stdout: string, stderr: string) {
      if (error || stderr) {
        this.logger('Error on searching for plugins: '+ error + stderr);
        return deffered.reject('Error on searching for plugins: '+ error + stderr);
      }
      let plugins = JSON.parse(stdout).dependencies;
      this.plugins = this.filterDependencies(plugins, "^" + this.config.pluginPrefix);
      
      this.initialised = true;
      deffered.resolve(this.plugins);
    }
    
    return deffered.promise;
  }
  
  /**
   * filters the plugin dependencies with the configured prefix out of the all packages
   */
  filterDependencies(json: any, regexString: string) {
    if (!json || json === {}) {
      return {};
    }
    var pattern = new RegExp(regexString);
    var returnJson: any = {};
    var keys = Object.keys(json);
    keys.forEach(function(entry) {
      if (pattern.test(entry)) {
        returnJson[entry] = json[entry];
        returnJson[entry].dependencies = this.filterDependencies(returnJson[entry].dependencies, regexString);
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

DependencyManager.$inject = {
  deps: ['config', 'logger'],
  callAs: 'class'
};
