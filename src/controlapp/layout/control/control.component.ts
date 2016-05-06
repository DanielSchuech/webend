import {Component} from '@angular/core';
import {RouteConfig, ROUTER_DIRECTIVES} from '@angular/router-deprecated';

import {DashboardComponent} from '../dashboard/dashboard.component';
import {ManageComponent} from '../manage/manage.component';
import {ConfigurationComponent} from '../configuration/configuration.component';
import {InstallationComponent} from '../installation/installation.component';

@Component({
  selector: 'control',
  template: require('./control.html'),
  directives: [ROUTER_DIRECTIVES]
})
@RouteConfig([
  {path: '/dashboard', name: 'Dashboard', component: DashboardComponent, useAsDefault: true},
  {path: '/management', name: 'Management', component: ManageComponent},
  {path: '/management/:plugin', name: 'Configuration', component: ConfigurationComponent},
  {path: '/installation', name: 'Installation', component: InstallationComponent},
])
export class ControlComponent {}
