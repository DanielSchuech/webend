///<reference path="../../../typings/main.d.ts" />
import Installation from '../../../build/server/modules/installation';
import {LoggerMock, WebSocketMock, childProcessMock,
    PluginSystemMock, DepManagerMock} from '../../support/servermocks';
import * as proxyquire from 'proxyquire';

describe('Server - Modules - Installation:', () => {
  let module: Installation;
  let websocket: WebSocketMock;
  let logger: LoggerMock;
  let ps: PluginSystemMock;
  let depManager: DepManagerMock;
  
  beforeEach(() => {
    websocket = new WebSocketMock();
    logger = new LoggerMock();
    ps = new PluginSystemMock();
    depManager = new DepManagerMock();
    let installMod = proxyquire('../../../build/server/modules/installation', {
      'child_process': childProcessMock
    }).default;
    module = new installMod(<any>websocket, <any>logger, <any>ps, <any>depManager);
  });
  
  it('register websocket listener for install, fileUpload & fileUploadStart', () => {
    expect(websocket.clientListener['install']).toBeDefined();
    expect(websocket.clientListener['fileUpload']).toBeDefined();
    expect(websocket.clientListener['fileUploadStart']).toBeDefined();
  });
  
  it('install npm package', () => {
    spyOn(childProcessMock, 'spawn').and.callThrough();
    spyOn(logger, 'log');
    module.installListener('myModule');
    
    let options: any = {};
    if (process.platform === 'win32') {
      options.shell = true;
    }
    expect(childProcessMock.spawn)
      .toHaveBeenCalledWith('npm', ['install', '--save', 'myModule'], options);
    expect(logger.log).toHaveBeenCalledWith('stdout');
    expect(logger.log).toHaveBeenCalledWith('stderr');
  });
  
  it('restart on successful installations', () => {
    module.installListener('myModule');
    expect(childProcessMock.events['close']).toBeDefined();
    spyOn(ps, 'restart');
    spyOn(depManager, 'initialise');
    childProcessMock.events['close'](0);
    expect(ps.restart).toHaveBeenCalled();
    expect(depManager.initialise).toHaveBeenCalled();
  });
  
  it('no restart on failed installations', () => {
    module.installListener('myModule');
    expect(childProcessMock.events['close']).toBeDefined();
    spyOn(ps, 'restart');
    spyOn(depManager, 'initialise');
    spyOn(logger, 'log');
    childProcessMock.events['close'](1);
    expect(ps.restart).not.toHaveBeenCalled();
    expect(depManager.initialise).not.toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalledWith('Installation failed with Error Code: 1');
  });
  
  it('exit on installtion escape with &&', () => {
    spyOn(childProcessMock, 'spawn');
    module.installListener('myModule && echo "hacked"');
    expect(childProcessMock.spawn).not.toHaveBeenCalled();
  });
});
