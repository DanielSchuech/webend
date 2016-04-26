///<reference path="../../../typings/main.d.ts" />
import LoggerRequests from '../../../build/server/modules/logger';
import {LoggerMock, WebSocketMock} from '../../support/servermocks';

describe('Server - Modules - Logger:', () => {
  let module: LoggerRequests;
  let websocket: WebSocketMock;
  let logger: LoggerMock;
  
  beforeEach(() => {
    websocket = new WebSocketMock();
    spyOn(websocket, 'emit');
    logger = new LoggerMock();
    module = new LoggerRequests(<any>websocket, <any>logger);
  });
  
  it('register listener in Logger', () => {
    expect(logger.listener.length).toEqual(1);
  });
  
  it('registered logger listener broadcasts log', () => {
    logger.listener[0]('myLog');
    expect(websocket.emit).toHaveBeenCalledWith('newLog', 'myLog');
  });
  
  it('getLogs websocket route', () => {
    spyOn(websocket.clientSocket, 'emit');
    expect(websocket.clientListener['getLogs']).toBeDefined();
    websocket.clientListener['getLogs']();
    expect(websocket.clientSocket.emit).toHaveBeenCalledWith('getLogs', 'history');
  });
});
