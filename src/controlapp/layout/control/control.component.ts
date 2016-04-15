import {Component} from 'angular2/core';
import {RouteConfig, ROUTER_DIRECTIVES} from 'angular2/router';

import {DashboardComponent} from '../dashboard/dashboard.component';
import {ManageComponent} from '../manage/manage.component';

@Component({
  selector: 'control',
  template: require('./control.html'),
  directives: [ROUTER_DIRECTIVES]
})
@RouteConfig([
  {path: '/dashboard', name: 'Dashboard', component: DashboardComponent, useAsDefault: true},
  {path: '/management', name: 'Management', component: ManageComponent}
])
export class ControlComponent {}
