import {Component} from 'angular2/core';
import {Websocket} from '../../services/websocket';

@Component({
  selector: 'status',
  template: require('./dashboard.html')
})
export class DashboardComponent {
  public logs: string;
  public pluginStatus: {[name: string]: boolean} = {};
  public activePlugins: string[] = [];
  
  constructor(private websocket: Websocket) {
    this.registerWebsocketListener();
    this.startRequsts();
  }
  
  registerWebsocketListener() {
    //get all system logs
    this.websocket.socket.on('getLogs', (data: string) => {
      this.logs = data;
    });
    
    //on new system logs
    this.websocket.socket.on('newLog', (data: string) => {
      this.logs += data;
    });
    
    //change of a plugin status
    this.websocket.socket.on('pluginStatus', (data: {[name: string]: boolean}) => {
      this.pluginStatus = data;
      
      //evaluate active plugins
      this.activePlugins = [];
      let keys = Object.keys(data);
      keys.forEach((plugin) => {
        if (data[plugin] && plugin !== 'webend' && data['webend']) {
          this.activePlugins.push(plugin);
        }
      });
    });
  }
  
  /**
   * collect data for start up
   */
  startRequsts() {
    this.websocket.socket.emit('getLogs');
    this.websocket.socket.emit('pluginStatus');
  }
  
  /**
   * action for plugin system
   */
  startPluginSystem() {
    this.websocket.socket.emit('startPluginSystem');
  }
  restartPluginSystem() {
    this.websocket.socket.emit('restartPluginSystem');
  }
  stopPluginSystem() {
    this.websocket.socket.emit('stopPluginSystem');
  }
}

