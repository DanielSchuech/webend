import * as io from 'socket.io-client';
import {Authentication} from './authentication';
import {Injectable} from '@angular/core';

@Injectable()
export class Websocket {
  public socket: any;
  constructor(private auth: Authentication) {
    this.connect();
  }
  
  connect() {
    let token = localStorage.getItem('token');
    this.socket = io('', {
      query: 'token=' + token
    });
    this.socket.on('error', (error: any) => {
      if (error.type === 'UnauthorizedError' || error.code === 'invalid_token') {
        this.auth.logout();
      }
    });
  }
}
