///<reference path="../../typings/main.d.ts" />
import * as proxyquire from 'proxyquire';
let config: any = {};
let system = proxyquire('../../build/pluginsystem/system', {
  './config': config
}).System;

describe('PluginSystem - System:', () => {
  
  beforeEach(() => {
    //dont show up console logs which are informing control system
    spyOn(console, 'log');
  });
  
  it('check injector bindings on startup', () => {
    let module = new system();
    expect((<any>module).pluginInjector.get('injector')).toBeDefined();
    expect((<any>module).pluginInjector.get('status')).toBeDefined();
    expect((<any>module).pluginInjector.get('config')).toBeDefined();
  });
  
  it('start - deps already initialised', () => {
    let scope = {
      depManager: {
        isInitialised: () => {return true; },
        getPlugins: () => {return 'plugins'; }
      },
      loadPlugins: () => {}
    };
    spyOn(scope, 'loadPlugins');
    system.prototype.start.bind(scope)();
    expect(scope.loadPlugins).toHaveBeenCalledWith('plugins');
  });
  
  it('start - deps needs to be initialised', () => {
    let scope = {
      depManager: {
        isInitialised: () => {return false; },
        initialise: () => {return {then: (fn: Function) => {fn('test'); }}; }
      },
      loadPlugins: () => {}
    };
    spyOn(scope, 'loadPlugins');
    system.prototype.start.bind(scope)();
    expect(scope.loadPlugins).toHaveBeenCalledWith('test');
  });
  
  it('loadPlugins', () => {
    let deps = {
      webend_server: {},
      webend_testpage: {}
    };
    let scope = {
      startPlugin: () => {},
      changePluginStatus: () => {}
    };
    config.enabled = {
      webend_server: true,
      webend_testpage: false
    };
    spyOn(scope, 'startPlugin');
    spyOn(scope, 'changePluginStatus');
    system.prototype.loadPlugins.bind(scope)(deps);
    expect(scope.startPlugin).toHaveBeenCalledWith('webend_server');
    expect(scope.changePluginStatus).toHaveBeenCalledWith('webend_testpage', false);
  });
});
