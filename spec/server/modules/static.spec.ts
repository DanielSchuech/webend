///<reference path="../../../typings/main.d.ts" />
import Static from '../../../build/server/modules/static';
import {ExpressMock} from '../../support/servermocks';

describe('Server - Modules - Static:', () => {
  let module: Static;
  let express: ExpressMock;
  beforeEach(() => {
    express = new ExpressMock();
    spyOn(express.res, 'sendFile');
    module = new Static(<any>express);
  });
  
  it('registers routes for js, css, fonts, default', () => {
    expect(express.registeredRoutes['GET'].indexOf('/bundle.js') > -1)
      .toBeTruthy();
    expect(express.registeredRoutes['GET'].indexOf('/main.css') > -1)
      .toBeTruthy();
    expect(express.registeredRoutes['GET'].indexOf('/fonts/:font') > -1)
      .toBeTruthy();
    expect(express.registeredRoutes['GET'].indexOf('/*') > -1)
      .toBeTruthy();
    expect(express.res.sendFile).toHaveBeenCalledTimes(4);
  });
});
