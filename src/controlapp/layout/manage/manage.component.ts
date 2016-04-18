import {Component} from 'angular2/core';
import {StatusComponent} from '../../helper/status/status.component';
import {SwitchComponent} from '../../helper/switch/switch.component';
import {Websocket} from '../../services/websocket';

@Component({
  selector: 'manage',
  template: require('./manage.html'),
  directives: [StatusComponent, SwitchComponent]
})
export class ManageComponent {
  public plugins: Plugin[] = [];
  
  constructor(private websocket: Websocket) {    
    this.registerWebsocketRoutes();
    websocket.socket.emit('getPluginMetadata');
    websocket.socket.emit('pluginStatus');
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
        if (index > -1) {
          //check loading status
          if (!this.plugins[index].status) {
            this.addStoppedWarning(plugin, this.plugins[index]);
          }
          //check autostart
          if (!this.plugins[index].enabled) {
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
   * registers event listener for websocket connection
   */
  registerWebsocketRoutes() {
    /**
     * adds new metadata(start enabled status & dependencies) into plugins
     */
    this.websocket.socket.on('getPluginMetadata', (data: any) => {
      let keys = Object.keys(data.deps);
      keys.forEach((key) => {
        //iff plugin exists in plugins -> override settings
        let index = this.indexOfPlugin(key);
        if (index > -1) {
          this.plugins[index].deps = data.deps[key].dependencies;
          this.plugins[index].enabled = data.enabled[key];
        }
        //else push new one if not webend (this is the whole system)
        else if (key !== 'webend') {
          this.plugins.push({
            name: key,
            status: false,
            enabled: data.enabled[key],
            deps: data.deps[key].dependencies
          });
        }
      });
      this.checkDeps();
    });
    
    /**
     * adds current plugin status into plugins
     */
    this.websocket.socket.on('pluginStatus', (data: any) => {
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
            enabled: false,
            deps: {}
          });
        }
      });
      this.checkDeps();
    });
  }
}

export interface Plugin {
  name: string, 
  status: boolean, 
  enabled: boolean, 
  deps: any,
  warning?: string
}
