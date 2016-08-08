import {Daemon} from './server/server';
import * as path from 'path';
import {getGlobalConfig} from './helper';

let serverconf = getGlobalConfig();

new Daemon(serverconf);