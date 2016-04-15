import {Component} from 'angular2/core';
import {RouteConfig, ROUTER_DIRECTIVES} from 'angular2/router';

import {LoginComponent} from './login/login.component';
import {ControlComponent} from './control/control.component';

@Component({
  selector: 'webend-control',
  template: require('./app.html'),
  directives: [ROUTER_DIRECTIVES]
})
@RouteConfig([
  {path: '/login', name: 'Login', component: LoginComponent},
  {path: '/control/...', name: 'Control', component: ControlComponent, useAsDefault: true}
])
export class AppComponent {}
