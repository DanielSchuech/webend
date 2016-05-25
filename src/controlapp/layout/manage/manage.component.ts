import {Component, OnDestroy} from '@angular/core';
import {StatusComponent} from '../../helper/status/status.component';
import {SwitchComponent} from '../../helper/switch/switch.component';
import {Websocket} from '../../services/websocket';
import {ROUTER_DIRECTIVES} from '@angular/router-deprecated';

@Component({
  selector: 'manage',
  template: require('./manage.html'),
  directives: [StatusComponent, SwitchComponent, ROUTER_DIRECTIVES]
})
export class ManageComponent implements OnDestroy {
  public plugins: Plugin[] = [];
  public changedAutostart = false;
  
  constructor(private websocket: Websocket) {    
    this.registerWebsocketRoutes();
    websocket.socket.emit('getPluginMetadata');
    websocket.socket.emit('pluginStatus');
  }
  
  ngOnDestroy() {
    this.websocket.socket.removeListener('getPluginMetadata', this.getPluginMetadataListener);
    this.websocket.socket.removeListener('pluginStatus', this.pluginStatusListener);
  }
  
  indexOfPlugin(pluginName: string) {
    let index = -1;
    this.plugins.forEach((plugin) => {
      if (plugin.name === pluginName) {
        index = this.plugins.indexOf(plugin);
      }
    });
    return index;
  }
  
  startPlugin(plugin: string) {
    this.websocket.socket.emit('startPlugin', plugin);
  }
  
  /**
   * checks for all plugins if all dependencies are loaded at autostart 
   * and are currently started
   */
  checkDeps() {
    //for all plugins
    this.plugins.forEach((plugin) => {
      //reset old warnings
      plugin.warning = '';
      
      //for each dependency of plugin
      let deps = Object.keys(plugin.deps);
      deps.forEach((dep) => {
        let index = this.indexOfPlugin(dep);
        let isOptional = plugin.optDeps && Object.keys(plugin.optDeps).indexOf(dep) !== -1;
        if (index > -1 && !isOptional) {
          //check loading status
          if (!this.plugins[index].status) {
            this.addStoppedWarning(plugin, this.plugins[index]);
          }
          //check autostart iff plugin is in autostart
          if (!this.plugins[index].autostart && plugin.autostart) {
            this.addAutostartWarning(plugin, this.plugins[index]);
          }
        }
      });
    });
  }
  
  /**
   * adds warning when dependencies are not in autostart
   */
  addAutostartWarning(plugin: Plugin, required: Plugin) {
    plugin.warning += 'requires ' + required.name + ' which is not in autostart!\n';
  }
  
  /**
   * adds warnings if dependencies are not started
   */
  addStoppedWarning(plugin: Plugin, required: Plugin) {
    plugin.warning += 'requires ' + required.name + ' which is not started!\n';
  }
  
  /**
   * checks if changes are done on autostart settings,
   * result available in changedAutostart
   */
  isAutostartChanged() {
    this.changedAutostart = false;
    this.plugins.forEach((plugin) => {
      if (plugin.switch !== plugin.autostart) {
        this.changedAutostart = true;
      }
    });
    return this.changedAutostart;
  }
  
  /**
   * save autostart settings
   */
  save() {
    let enabled: {[name: string]: boolean} = {};
    this.plugins.forEach((plugin) => {
      enabled[plugin.name] = plugin.switch;
    });
    this.websocket.socket.emit('saveAutostart', enabled);
  }
  
  /**
   * registers event listener for websocket connection
   */
  registerWebsocketRoutes() {
    //adds new metadata(start enabled status & dependencies) into plugins
    this.websocket.socket.on('getPluginMetadata', this.getPluginMetadataListener);

    //adds current plugin status into plugins
    this.websocket.socket.on('pluginStatus', this.pluginStatusListener);
  }
  
  /**
   * websocket listeners
   */
  getPluginMetadataListener = this._getPluginMetadataListener.bind(this);
  _getPluginMetadataListener(data: any) {
    let keys = Object.keys(data.deps);
    keys.forEach((key) => {
      //iff plugin exists in plugins -> override settings
      let index = this.indexOfPlugin(key);
      if (index > -1) {
        this.plugins[index].deps = data.deps[key].dependencies;
        this.plugins[index].optDeps = data.deps[key].optionalDependencies;
        this.plugins[index].autostart = data.enabled[key];
        this.plugins[index].switch = data.enabled[key];
      }
      //else push new one if not webend (this is the whole system)
      else if (key !== 'webend') {
        this.plugins.push({
          name: key,
          status: false,
          autostart: data.enabled[key],
          switch: data.enabled[key],
          deps: data.deps[key].dependencies,
          optDeps: data.deps[key].optionalDependencies
        });
      }
    });
    this.checkDeps();
    this.isAutostartChanged();
  }
  
  pluginStatusListener = this._pluginStatusListener.bind(this);
  _pluginStatusListener(data: any) {
    let keys = Object.keys(data);
    keys.forEach((key) => {
      //iff plugin exists in plugins -> override settings
      let index = this.indexOfPlugin(key);
      if (index > -1) {
        this.plugins[index].status = data[key];
      }
      //else push new one if not webend (this is the whole system)
      else if (key !== 'webend') {
        this.plugins.push({
          name: key,
          status: data[key],
          autostart: false,
          switch: false,
          deps: {}
        });
      }
    });
    this.checkDeps();
  }
}

export interface Plugin {
  name: string, 
  status: boolean,    //current status
  autostart: boolean, //autostart enabled
  switch: boolean,    //switch setting for autostart
  deps: any,
  optDeps?: any,
  warning?: string
}
