import 'zone.js/dist/zone';
import 'reflect-metadata';

import {bootstrap}    from '@angular/platform-browser-dynamic';
import {AppComponent} from './layout/app.component';
import {ROUTER_PROVIDERS} from '@angular/router-deprecated';

import {Websocket} from './services/websocket';

bootstrap(AppComponent, [
  ROUTER_PROVIDERS,
  Websocket
]);
