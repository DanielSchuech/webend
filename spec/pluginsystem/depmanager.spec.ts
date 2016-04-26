///<reference path="../../typings/main.d.ts" />
import {DependencyManager} from '../../build/pluginsystem/depmanager';
import {childProcessMock} from '../support/servermocks';
import * as proxyquire from 'proxyquire';

describe('PluginSystem - DependencyManager:', () => {
  let module: DependencyManager;
  
  beforeEach(() => {
    let depMod = proxyquire('../../build/pluginsystem/depmanager', {
      'child_process': childProcessMock
    }).DependencyManager;
    module = new depMod();
  });
  
  it('initialise without error', (done) => {
    let testdata = JSON.stringify({
      dependencies: {
        myPlugin: {
          version: '0.1.1',
          dependencies: {lodash: {version: '3.4.x'}}
        },
        webend_server: {
          version: '1.0.0',
          dependencies: {}
        },
        webend_testpage: {
          version: '0.0.1',
          dependencies: {
            webend_server: {version: '1.0.0'},
            lodash: {version: '3.4.x'}
          }
        }
      }
    });
    childProcessMock.execFnArgs = [null, testdata, null];
    
    module.initialise().then((data: any) => {
      expect(data.myPlugin).toBeUndefined();
      expect(data.webend_server).toEqual({
        version: '1.0.0',
        dependencies: {}
      });
      expect(data.webend_testpage).toEqual({
        version: '0.0.1',
        dependencies: {
          webend_server: {
            version: '1.0.0',
            dependencies: {}
          }
        }
      });
      expect(Object.keys(data).length).toEqual(2);
      expect((<any>module).initialised).toBeTruthy();
      done();
    });
  });
  
  it('initialise with extraneous warning', (done) => {
    spyOn(console, 'log');
    let testdata = JSON.stringify({
      dependencies: {
        webend_server: {
          version: '1.0.0',
          dependencies: {}
        }
      }
    });
    childProcessMock.execFnArgs = 
      [null, testdata, 'npm ERR! extraneous: ... some package not listed'];
    module.initialise().then((data: any) => {
      expect(console.log).toHaveBeenCalled();
      expect(data).toEqual({
        webend_server: {
          version: '1.0.0',
          dependencies: {}
        }
      });
      expect((<any>module).initialised).toBeTruthy();
      done();
    });  
  });
  
  it('initialise with error', (done) => {
    spyOn(DependencyManager, 'filterDependencies');
    spyOn(console, 'log');
    childProcessMock.execFnArgs = ['Failed!', '', ''];
    module.initialise().then(() => {}, (err: string) => {
      expect(err).toEqual('Error on searching for plugins: Failed!');
      expect(DependencyManager.filterDependencies).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalled();
      expect((<any>module).initialised).toBeFalsy();
      done();
    });
  });
  
  it('isInitialised', () => {
    (<any>module).initialised = false;
    expect(module.isInitialised()).toBeFalsy();
    (<any>module).initialised = true;
    expect(module.isInitialised()).toBeTruthy();
  });
  
  it('getPlugins', () => {
    (<any>module).plugins = 'myPlugins';
    expect(module.getPlugins()).toEqual('myPlugins');
  });
  
});
