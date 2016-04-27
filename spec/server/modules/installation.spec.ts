///<reference path="../../../typings/main.d.ts" />
import Installation from '../../../build/server/modules/installation';
import {LoggerMock, WebSocketMock, childProcessMock,
    PluginSystemMock, DepManagerMock} from '../../support/servermocks';
import * as proxyquire from 'proxyquire';
import * as q from 'q';

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
  
  it('merge configs on successful installations', () => {
    module.installListener('myModule');
    expect(childProcessMock.events['close']).toBeDefined();
    spyOn(module, 'mergeConfigs');
    childProcessMock.events['close'](0);
    expect(module.mergeConfigs).toHaveBeenCalled();
  });
  
  it('failed log + no config merge on failed installations', () => {
    module.installListener('myModule');
    expect(childProcessMock.events['close']).toBeDefined();
    spyOn(logger, 'log');
    spyOn(module, 'mergeConfigs');
    childProcessMock.events['close'](1);
    expect(logger.log).toHaveBeenCalledWith('Installation failed with Error Code: 1');
    expect(module.mergeConfigs).not.toHaveBeenCalled();
  });
  
  it('exit on installtion escape with &&', () => {
    spyOn(childProcessMock, 'spawn');
    module.installListener('myModule && echo "hacked"');
    expect(childProcessMock.spawn).not.toHaveBeenCalled();
  });
  
  it('merge configs successfully', (done) => {
    depManager.initialise = () => {
      let deffered = q.defer();
      deffered.resolve({
        a: 'a', b: 'b'
      });
      return deffered.promise;
    };
    let checkFake = () => {return true; };
    spyOn(module, 'checkConfigsforAllDeps').and.callFake(checkFake);
    spyOn(logger, 'log');
    spyOn(ps, 'restart');
    spyOn(depManager, 'initialise').and.callThrough();
    module.mergeConfigs().then(() => {
      expect(module.checkConfigsforAllDeps).toHaveBeenCalledWith(['a', 'b']);
      expect(logger.log).toHaveBeenCalledWith('Installation succesfully completed');
      expect(ps.restart).toHaveBeenCalled();
      expect(depManager.initialise).toHaveBeenCalledTimes(2);
      done();
    });
  });
  
  it('merge configs failed', (done) => {
    depManager.initialise = () => {
      let deffered = q.defer();
      deffered.resolve({});
      return deffered.promise;
    };
    let checkFake = () => {throw Error('failed'); };
    spyOn(module, 'checkConfigsforAllDeps').and.callFake(checkFake);
    spyOn(logger, 'log');
    spyOn(ps, 'restart');
    spyOn(depManager, 'initialise').and.callThrough();
    module.mergeConfigs().then(() => {
      expect(logger.log).toHaveBeenCalledWith('Installation failed');
      expect(ps.restart).not.toHaveBeenCalled();
      done();
    });
  });
  
  it('checkConfigsforAllDeps', () => {
    let mergeFake = () => {return {then: (fn: Function) => {fn(); }}; };
    spyOn(module, 'mergeConfigForPlugin').and.callFake(mergeFake);
    let deps = [
      {webendConfig: 'a config', name: 'a'},
      {name: 'b'},
      {webendConfig: 'c config', name: 'c'}
    ];
    module.checkConfigsforAllDeps(deps);
    expect(module.mergeConfigForPlugin).toHaveBeenCalledTimes(2);
    expect(module.mergeConfigForPlugin).toHaveBeenCalledWith('a', 'a config');
    expect(module.mergeConfigForPlugin).toHaveBeenCalledWith('c', 'c config');
  });
  
  it('mergeConfigForPlugin not empty', () => {
    let conf = { //readed config from config file
      enabled: 'plugins activation',
      plugins: {
        webend_server: 'some configs'
      }
    };
    let config = 'new config'; //new config from installation
    (<any>module).configuration = {
      readConfigFile: () => {return {then: (fn: Function) => {fn(conf); }}; },
      writeConfigFile: () => {}
    };
    spyOn(module, 'assignConfigToDefault');
    spyOn((<any>module).configuration, 'writeConfigFile');
    module.mergeConfigForPlugin('webend_server', config);
    expect(module.assignConfigToDefault).toHaveBeenCalledWith(config, 'some configs');
    expect((<any>module).configuration.writeConfigFile).toHaveBeenCalledWith({
      enabled: 'plugins activation',
      plugins: {
        webend_server: 'new config'
      }
    });
  });
  
  it('mergeConfigForPlugin -> entry does not exist -> create', () => {
    let conf = { //readed config from config file
      enabled: 'plugins activation',
      plugins: {}
    };
    let config = 'new config'; //new config from installation
    (<any>module).configuration = {
      readConfigFile: () => {return {then: (fn: Function) => {fn(conf); }}; },
      writeConfigFile: () => {}
    };
    spyOn(module, 'assignConfigToDefault');
    spyOn((<any>module).configuration, 'writeConfigFile');
    module.mergeConfigForPlugin('webend_server', config);
    expect(module.assignConfigToDefault).toHaveBeenCalledWith(config, {});
    expect((<any>module).configuration.writeConfigFile).toHaveBeenCalledWith({
      enabled: 'plugins activation',
      plugins: {
        webend_server: 'new config'
      }
    });
  });
  
  it('assignConfigToDefault -> no parameter empty', () => {
    let def = {
      a: 'abc',
      b: {
        c: 123,
        d: 'new'
      }
    };
    let existing = {
      a: 'xyz',
      b: {
        c: 789
      },
      e: 'old'
    };
    module.assignConfigToDefault(def, existing);
    expect(def.a).toEqual('xyz');
    expect(def.b.c).toEqual(789);
    expect(def.b.d).toEqual('new');
    expect((<any>def).e).toBeUndefined();
  });
  
  it('assignConfigToDefault -> def undefined', () => {
    //should not throw an error
    module.assignConfigToDefault(undefined, {a: 'myConfig'});
  });
  
  it('assignConfigToDefault -> def {}', () => {
    let def = {};
    module.assignConfigToDefault(def, {a: 'myConfig'});
    expect(def).toEqual({});
  });
  
  it('assignConfigToDefault -> my undefined', () => {
    let def = {new: 'myConfig'};
    module.assignConfigToDefault(def, null);
    expect(def).toEqual({new: 'myConfig'});
  });
});
