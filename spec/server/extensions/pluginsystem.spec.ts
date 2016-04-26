///<reference path="../../../typings/main.d.ts" />
import PluginSystem from '../../../build/server/extensions/pluginsystem';
import {LoggerMock, WebSocketMock, childProcessMock} from '../../support/servermocks';
  import * as proxyquire from 'proxyquire';
let config: any = {server: {SysComPort: 5056}};

let psSocket: WebSocketMock;
let expressModuleMock = () => {};
let httpMockServer: any;
let httpMock: any = {
  Server: () => {return httpMockServer; }
};

let socketMock = () => {return psSocket; };

describe('Server - Extensions - PluginSystem:', () => {
  let module: PluginSystem;
  let websocket: WebSocketMock;
  let logger: LoggerMock;
  
  beforeEach(() => {
    httpMockServer = {listen: () => {}};
    spyOn(httpMockServer, 'listen');
    
    websocket = new WebSocketMock();
    spyOn(websocket.clientSocket, 'emit');
    logger = new LoggerMock();
    psSocket = new WebSocketMock();
    let configMod = proxyquire('../../../build/server/extensions/pluginsystem', {
      'child_process': childProcessMock,
      'express': expressModuleMock,
      'http': httpMock,
      'socket.io': socketMock
    }).default;
    module = new configMod(config, <any>logger, <any>websocket);
  });
  
  it('systemSocket for comunication to pluginSystem created', () => {
    expect((<any>module).systemSocket).toBeDefined();
    expect((<any>module).systemSocket instanceof WebSocketMock).toBeTruthy();
    expect(httpMockServer.listen)
      .toHaveBeenCalled();
  });
  
  it('start plugin system process', () => {
    spyOn(childProcessMock, 'spawn').and.callThrough();
    spyOn(logger, 'log');
    module.start();
    expect(childProcessMock.spawn).toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith('stdout');
    expect(logger.log).toHaveBeenCalledWith('stderr');
  });
  
  it('stop plugin system', () => {
    //set pluginStatus to true -> will be resettet by stop
    (<any>module).pluginStatus = {a: true, b: true, c: false};
    
    spyOn((<any>module).child, 'kill');
    spyOn(websocket, 'emit');
    spyOn(logger, 'log');
    
    module.stop();
    
    expect((<any>module).child.kill).toHaveBeenCalled();
    expect((<any>module).pluginStatus).toEqual({a: false, b: false, c: false});
    expect(websocket.emit)
      .toHaveBeenCalledWith('pluginStatus', (<any>module).pluginStatus);
    expect(logger.log).toHaveBeenCalledWith('Stopping Plugin System.............');
  });
  
  it('restart plugin system', () => {
    spyOn(module, 'start');
    spyOn(module, 'stop');
    module.restart();
    expect(module.stop).toHaveBeenCalled();
    expect(module.start).toHaveBeenCalled();
  });
  
  it('plugin system socket changeStatus route', () => {
    expect(psSocket.clientListener['changedStatus']).toBeDefined();
    (<any>module).pluginStatus = {};
    spyOn(websocket, 'emit');
    psSocket.clientListener['changedStatus']({new: 'Data'});
    expect((<any>module).pluginStatus).toEqual({new: 'Data'});
    expect(websocket.emit)
      .toHaveBeenCalledWith('pluginStatus', {new: 'Data'});
  });
  
  it('websocket startPluginSystem route', () => {
    spyOn(childProcessMock, 'spawn').and.callThrough();
    websocket.clientListener['startPluginSystem']();
    expect(childProcessMock.spawn).toHaveBeenCalled();
  });
  
  it('websocket stopPluginSystem route', () => {
    spyOn((<any>module).child, 'kill');
    websocket.clientListener['stopPluginSystem']();
    expect((<any>module).child.kill).toHaveBeenCalled();
  });
  
  it('websocket restartPluginSystem route', () => {
    spyOn(module, 'start');
    spyOn(module, 'stop');
    websocket.clientListener['restartPluginSystem']();
    expect(module.start).toHaveBeenCalled();
    expect(module.stop).toHaveBeenCalled();
  });
  
  it('websocket pluginStatus route', () => {
    websocket.clientListener['pluginStatus']();
    expect(websocket.clientSocket.emit)
      .toHaveBeenCalledWith('pluginStatus', (<any>module).pluginStatus);
  });
  
  it('websocket startPlugin route', () => {
    spyOn(psSocket, 'emit');
    websocket.clientListener['startPlugin']('myModule');
    expect(psSocket.emit)
      .toHaveBeenCalledWith('startPlugin', 'myModule');
  });
  
});
