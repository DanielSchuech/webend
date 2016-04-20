import {Component, OnDestroy} from 'angular2/core';
import {Websocket} from '../../services/websocket';
import {StatusComponent} from '../../helper/status/status.component';

@Component({
  selector: 'status',
  template: require('./dashboard.html'),
  directives: [StatusComponent]
})
export class DashboardComponent implements OnDestroy {
  public logs: string;
  public pluginStatus: {[name: string]: boolean} = {};
  public activePlugins: string[] = [];
  
  constructor(private websocket: Websocket) {
    this.registerWebsocketListener();
    this.startRequsts();
  }
  
  ngOnDestroy() {
    this.websocket.socket.removeListener('getLogs', this.getLogsListener);
    this.websocket.socket.removeListener('newLog', this.newLogListener);
    this.websocket.socket.removeListener('pluginStatus', this.pluginStatusListener);
  }
  
  registerWebsocketListener() {
    //get all system logs
    this.websocket.socket.on('getLogs', this.getLogsListener);
    
    //on new system logs
    this.websocket.socket.on('newLog', this.newLogListener);
    
    //change of a plugin status
    this.websocket.socket.on('pluginStatus', this.pluginStatusListener);
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
  
  /**
   * websocket listeners
   */
  pluginStatusListener = this._pluginStatusListener.bind(this);
  _pluginStatusListener(data: {[name: string]: boolean}) {
    this.pluginStatus = data;
    
    //evaluate active plugins
    this.activePlugins = [];
    let keys = Object.keys(data);
    keys.forEach((plugin) => {
      if (data[plugin] && plugin !== 'webend' && data['webend']) {
        this.activePlugins.push(plugin);
      }
    });
  }
  
  getLogsListener = this._getLogsListener.bind(this);
  _getLogsListener(data: string) {
    this.logs = data;
  }
  
  newLogListener = this._newLogListener.bind(this);
  _newLogListener(data: string) {
    this.logs += data;
  }
}

