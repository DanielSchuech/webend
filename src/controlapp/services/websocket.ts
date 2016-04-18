import * as io from 'socket.io-client';

export class Websocket{
  public socket: any;
  constructor() {
    this.socket = io();
  }
}