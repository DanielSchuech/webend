import {Component} from 'angular2/core';
import {Websocket} from '../../services/websocket';

@Component({
  selector: 'status',
  template: require('./dashboard.html')
})
export class DashboardComponent {
  public logs: string;
  
  constructor(private websocket: Websocket) {
    this.registerWebsocketListener();
    this.requstLogs();
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
  }
  
  requstLogs() {
    this.websocket.socket.emit('getLogs');
  }
  
  restartPluginSystem() {
    this.websocket.socket.emit('restartPluginSystem');
  }
}

