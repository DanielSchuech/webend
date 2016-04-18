import 'zone.js/dist/zone';
import 'reflect-metadata';

import {bootstrap}    from 'angular2/platform/browser';
import {AppComponent} from './layout/app.component';
import {ROUTER_PROVIDERS} from 'angular2/router';

import {Websocket} from './services/websocket';

bootstrap(AppComponent, [
  ROUTER_PROVIDERS,
  Websocket
]);
