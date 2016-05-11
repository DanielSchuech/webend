import 'zone.js/dist/zone';
import 'reflect-metadata';

import {bootstrap}    from '@angular/platform-browser-dynamic';
import {AppComponent} from './layout/app.component';
import {ROUTER_PROVIDERS} from '@angular/router-deprecated';
import {HTTP_PROVIDERS} from '@angular/http';

import {Websocket} from './services/websocket';
import {Authentication} from './services/authentication';

bootstrap(AppComponent, [
  ROUTER_PROVIDERS,
  HTTP_PROVIDERS,
  Websocket,
  Authentication
]);
