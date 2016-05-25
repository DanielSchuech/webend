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
      loadPlugins: () => {},
      addManualStartListener: () => {}
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
      loadPlugins: () => {},
      addManualStartListener: () => {}
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
      changePluginStatus: () => {},
      pluginInjector: {bind: () => {return {to: () => {}}; }}
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
  
  it('startPlugin', () => {
    let scope = {
      status: {webend: true},
      depManager: {getPlugins: () => {return {
        webend_server: {main: 'index.js'}
      }; }},
      pluginInjector: {bind: () => {return {load: () => {return true; }}; }},
      changePluginStatus: () => {},
      loadDependencies: () => {return true; }
    };
    spyOn(scope.pluginInjector, 'bind').and.callThrough();
    spyOn(scope, 'changePluginStatus');
    let started = system.prototype.startPlugin.bind(scope)('webend_server');
    expect(started).toBeTruthy();
    expect(scope.pluginInjector.bind).toHaveBeenCalledWith('webend_server');
    expect(scope.changePluginStatus).toHaveBeenCalledWith('webend_server', true);
  });
  
  it('startPlugin -> failed to laod module', () => {
    let scope = {
      status: {webend: true},
      depManager: {getPlugins: () => {return {
        webend_server: {main: 'index.js'}
      }; }},
      pluginInjector: {bind: () => {return {load: () => {
        throw Error('Module not found');
      }}; }},
      changePluginStatus: () => {},
      loadDependencies: () => {return true; }
    };
    spyOn(scope, 'changePluginStatus');
    let started = system.prototype.startPlugin.bind(scope)('webend_server');
    expect(started).toBeFalsy();
    expect(scope.changePluginStatus).toHaveBeenCalledWith('webend_server', false);
    expect(console.log).toHaveBeenCalledWith('Could not load plugin: webend_server');
  });
  
  it('startPlugin -> frontend plugin only', () => {
    let scope = {
      status: {webend: true},
      depManager: {getPlugins: () => {return {
        webend_server: {}
      }; }},
      pluginInjector: {bind: () => {return {load: () => {}}; }},
      changePluginStatus: () => {},
      loadDependencies: () => {return true; }
    };
    spyOn(scope.pluginInjector, 'bind').and.callThrough();
    spyOn(scope, 'changePluginStatus');
    let started = system.prototype.startPlugin.bind(scope)('webend_server');
    expect(started).toBeTruthy();
    expect(scope.pluginInjector.bind).not.toHaveBeenCalled();
    expect(scope.changePluginStatus).toHaveBeenCalledWith('webend_server', true);
  });
  
  it('startPlugin -> dependencies not available', () => {
    let scope = {
      status: {webend: true},
      depManager: {getPlugins: () => {return {
        webend_server: {main: 'index.js'}
      }; }},
      changePluginStatus: () => {},
      loadDependencies: () => {return false; }
    };
    spyOn(scope, 'changePluginStatus');
    let started = system.prototype.startPlugin.bind(scope)('webend_server');
    expect(started).toBeFalsy();
    expect(scope.changePluginStatus).toHaveBeenCalledWith('webend_server', false);
    expect(console.log)
      .toHaveBeenCalledWith('Dependencies coudn\'t be loaded for webend_server');
  });
  
  it('startPlugin -> System not started', () => {
    let scope = {
      status: {webend: false},
      changePluginStatus: () => {}
    };
    spyOn(scope, 'changePluginStatus');
    let started = system.prototype.startPlugin.bind(scope)('webend_server');
    expect(started).toBeFalsy();
    expect(scope.changePluginStatus).toHaveBeenCalledWith('webend_server', false);
    expect(console.log)
      .toHaveBeenCalledWith('System not started -> Couldn\'t start Plugin webend_server');
  });
  
  it('loadDependencies', () => {
    let scope = {
      status: {},
      startPlugin: () => {return true; }
    };
    let deps = {dependencies: {
      a: {},
      b: {}
    }};
    spyOn(scope, 'startPlugin').and.callThrough();
    let success = system.prototype.loadDependencies.bind(scope)(deps, 'my');
    expect(success).toBeTruthy();
    expect(scope.startPlugin).toHaveBeenCalledWith('a');
    expect(scope.startPlugin).toHaveBeenCalledWith('b');
  });
  
  it('loadDependencies -> one not available', () => {
    let scope = {
      status: {},
      startPlugin: (p: string) => {
        if (p === 'b') return false;
        return true; 
      }
    };
    let deps = {dependencies: {
      a: {},
      b: {}
    }};
    let success = system.prototype.loadDependencies.bind(scope)(deps, 'my');
    expect(success).toBeFalsy();
  });
  
  it('loadDependencies -> dep already failed loading', () => {
    let scope = {
      status: {b: false},
      startPlugin: (p: string) => {
        if (p === 'b') return false;
        return true; 
      }
    };
    let deps = {dependencies: {
      a: {},
      b: {}
    }};
    spyOn(scope, 'startPlugin').and.callThrough();
    let success = system.prototype.loadDependencies.bind(scope)(deps, 'my');
    expect(success).toBeFalsy();
    expect(scope.startPlugin).toHaveBeenCalledWith('a');
    expect(scope.startPlugin).not.toHaveBeenCalledWith('b');
    expect(console.log).toHaveBeenCalledWith('Plugin my requires dependency b' +
      ' which couldnt be loaded or is deactivated -> activate it!');
  });
  
  it('loadDependencies -> empty deps', () => {
    let success = system.prototype.loadDependencies();
    expect(success).toBeTruthy();
    success = system.prototype.loadDependencies({}, 'abc');
    expect(success).toBeTruthy();
  });
  
  it('loadDependencies -> dep already loaded', () => {
    let scope = {
      status: {a: true},
      startPlugin: () => {return true; }
    };
    let deps = {dependencies: {
      a: {}
    }};
    spyOn(scope, 'startPlugin').and.callThrough();
    let success = system.prototype.loadDependencies.bind(scope)(deps, 'my');
    expect(success).toBeTruthy();
    expect(scope.startPlugin).not.toHaveBeenCalled();
    expect(console.log).not.toHaveBeenCalled();
  });
  
  it('changePluginStatus', () => {
    let scope: any = {
      status: {},
      socket: {changedStatus: () => {}}
    };
    spyOn(scope.socket, 'changedStatus');
    system.prototype.changePluginStatus.bind(scope)('a', true);
    expect(scope.status['a']).toBeTruthy();
    expect(scope.socket.changedStatus).toHaveBeenCalledWith(scope.status);
  });
  
});
