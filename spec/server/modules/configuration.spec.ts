///<reference path="../../../typings/main.d.ts" />
import Configuration from '../../../build/server/modules/configuration';
import {LoggerMock, WebSocketMock, PluginSystemMock, 
  DepManagerMock, fsMock} from '../../support/servermocks';
  import * as proxyquire from 'proxyquire';
 import * as q from 'q';

describe('Server - Modules - Configuration:', () => {
  let module: Configuration;
  let websocket: WebSocketMock;
  let logger: LoggerMock;
  let ps: PluginSystemMock;
  let depManager: DepManagerMock;
  
  beforeEach(() => {
    websocket = new WebSocketMock();
    spyOn(websocket.clientSocket, 'emit');
    logger = new LoggerMock();
    ps = new PluginSystemMock();
    depManager = new DepManagerMock();
    let configMod = proxyquire('../../../build/server/modules/configuration', {
      'q-io/fs': fsMock
    }).default;
    module = new configMod(<any>logger, <any>websocket, <any>ps, <any>depManager);
  });
  
  it('collectPluginsData -> depManager initialised', (done) => {
    depManager.isInitialised = () => {return true; };
    let deps = {
      webend_server: {},
      webend_testpage: {name: 'testpage'}
    };
    depManager.getPlugins = () => {return deps; };
    module.collectPluginsData().then((data: any) => {
      expect(data.deps).toEqual(deps);
      expect(data.enabled).toEqual({
        webend_server: false,
        webend_testpage: false
      });
      done();
    });
  });
  
  it('collectPluginsData -> depManager not initialised', (done) => {
    depManager.isInitialised = () => {return false; };
    let deps = {
      webend_server: {},
      webend_testpage: {name: 'testpage'}
    };
    depManager.initialise = () => {
      let deffered = q.defer();
      deffered.resolve(deps);
      return deffered.promise; 
    };
    module.collectPluginsData().then((data: any) => {
      expect(data.deps).toEqual(deps);
      expect(data.enabled).toEqual({
        webend_server: false,
        webend_testpage: false
      });
      done();
    });
  });
  
  it('getPluginMetadata route', () => {
    expect(websocket.clientListener['getPluginMetadata']).toBeDefined();
    let collectFake = () => {return {then: (fn: Function) => fn('myData')}; };
    spyOn(module, 'collectPluginsData').and.callFake(collectFake);
    websocket.clientListener['getPluginMetadata']();
    expect(websocket.clientSocket.emit)
      .toHaveBeenCalledWith('getPluginMetadata', 'myData');
  });
  
  it('writeConfigFile successfully -> no failed log', () => {
    spyOn(logger, 'log');
    let writeFake = () => {return {then: (fn: Function) => {fn('data'); }}; };
    spyOn(fsMock, 'write').and.callFake(writeFake);
    module.writeConfigFile({a: 'b'});
    expect(logger.log).not.toHaveBeenCalled();
  });
  
  it('writeConfigFile failed -> failed log', () => {
    spyOn(logger, 'log');
    let writeFake = () => {return {then: 
      (success: Function, failed: Function) => {failed('err'); }}; };
    spyOn(fsMock, 'write').and.callFake(writeFake);
    module.writeConfigFile({a: 'b'});
    expect(logger.log).toHaveBeenCalledWith('Error on writing Config File!');
  });
  
  it('writeAutostartConfigToFile', (done) => {
    spyOn(module, 'writeConfigFile').and.callFake((data: any) => {
      expect(data).toEqual({
        enabled: {a: true, b: false},
        plugins: {
          webend_server: {
            port: 3000,
            test: 1234567
          }
        }
      });
      done(); 
    });
    module.writeAutostartConfigToFile({a: true, b: false});
  });
  
  it('saveAutostart route', () => {
    expect(websocket.clientListener['saveAutostart']).toBeDefined();
    let writeFake = () => {
      return {then: (fn: Function) => {fn(); }};
    };
    spyOn(module, 'writeAutostartConfigToFile').and.callFake(writeFake);
    spyOn(module, 'sendMetadata');
    spyOn(ps, 'restart');
    websocket.clientListener['saveAutostart']();
    expect(module.sendMetadata).toHaveBeenCalled();
    expect(ps.restart).toHaveBeenCalled();
  });
  
  it('collectPluginConfigData -> depManager initialised', (done) => {
    depManager.isInitialised = () => {return true; };
    let deps = {
      webend_server: {name: 'webend_server'},
      webend_testpage: {name: 'testpage'}
    };
    depManager.getPlugins = () => {return deps; };
    module.collectPluginConfigData('webend_server').then((data: any) => {
      expect(data.info).toEqual(deps.webend_server);
      expect(data.config).toEqual({
        port: 3000,
        test: 1234567
      });
      done();
    });    
  });
  
  it('collectPluginConfigData -> depManager not initialised', (done) => {
    depManager.isInitialised = () => {return false; };
    let deps = {
      webend_server: {name: 'webend_server'},
      webend_testpage: {name: 'testpage'}
    };
    depManager.initialise = () => {
      let deffered = q.defer();
      deffered.resolve(deps);
      return deffered.promise; 
    };
    module.collectPluginConfigData('webend_server').then((data: any) => {
      expect(data.info).toEqual(deps.webend_server);
      expect(data.config).toEqual({
        port: 3000,
        test: 1234567
      });
      done();
    });    
  });
  
  it('getPluginConfig route', () => {
    expect(websocket.clientListener['getPluginConfig']).toBeDefined();
    let collectFake = () => {
      return {then: (fn: Function) => {fn('config'); }};
    };
    spyOn(module, 'collectPluginConfigData').and.callFake(collectFake);
    websocket.clientListener['getPluginConfig']();
    expect(websocket.clientSocket.emit)
      .toHaveBeenCalledWith('getPluginConfig', 'config');
  });
  
  it('savePluginConfig', (done) => {
    spyOn(module, 'writeConfigFile');
    module.savePluginConfig('webend_server', 'myConfig').then(() => {
      expect(module.writeConfigFile).toHaveBeenCalledWith({
        enabled: {
          webend_server: false,
          webend_testpage: false
        },
        plugins: {
          webend_server: 'myConfig'
        }
      });
      done();
    });
  });
  
  it('savePluginConfig route', () => {
    expect(websocket.clientListener['savePluginConfig']).toBeDefined();
    let saveFake = () => {
      return {then: (fn: Function) => {fn(); }};
    };
    spyOn(module, 'savePluginConfig').and.callFake(saveFake);
    
    let collectFake = () => {
      return {then: (fn: Function) => {fn('config'); }};
    };
    spyOn(module, 'collectPluginConfigData').and.callFake(collectFake);
    
    spyOn(ps, 'restart');
    websocket.clientListener['savePluginConfig']();
    expect(ps.restart).toHaveBeenCalled();
    expect(websocket.clientSocket.emit)
      .toHaveBeenCalledWith('getPluginConfig', 'config');
  });
  
  it('readConfigFile fails -> log', () => {
    fsMock.read = () => {return {then: 
      (success: Function, failed: Function) => failed()}; };
    spyOn(logger, 'log');
    module.readConfigFile();
    expect(logger.log).toHaveBeenCalledWith('Error on reading Config File!');
  });
});
