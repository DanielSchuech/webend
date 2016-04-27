import TinyDiInjectable from '../tinydiinjectable';
import {Logger} from '../logger';
import PluginSystem from '../extensions/pluginsystem';
import * as child_process from 'child_process';
import * as fs from 'fs';
import Configuration from './configuration';

import {DependencyManager} from '../../pluginsystem/depmanager';

export default class Installation extends TinyDiInjectable {
  private files: any = {}; //Files that are currently uploading
  
  constructor(private websocket: SocketIO.Server, private logger: Logger,
      private pluginSystem: PluginSystem, private depManager: DependencyManager,
      private configuration: Configuration) {
    super();
    
    websocket.on('connection', (socket) => {
      socket.on('install', this.installListener.bind(this));
      socket.on('fileUploadStart', this.uploadStartListener(socket));
      socket.on('fileUpload', this.uploadListener(socket));
    });
  }
  
  /**
   * websocket listener
   */
  installListener(npmPackage: string) {
    //TODO: some more filtering for security
    //Disable &&
    if (npmPackage.indexOf('&&') > -1) {
      this.logger.log('Its not allowed to use && for security reasons!');
      return;
    }
    
    let params = npmPackage.split(' ');
    params.unshift('--save');
    params.unshift('install');
    
    //spawn ignores PATHEXT on windows -> use cmd
    //https://github.com/nodejs/node-v0.x-archive/issues/2318
    let options: any = {};
    if (process.platform === 'win32') {
      options.shell = true;
    }
    
    let child = child_process.spawn('npm', params, options);
    child.stdout.on('data', (data: any) => {this.logger.log(`${data}`); });
    child.stderr.on('data', (data: any) => {this.logger.log(`${data}`); });
    
    child.on('close', (code: number) => {
      if (code === 0) {
        this.mergeConfigs();
      } else {
        //Installation failed
        this.logger.log(`Installation failed with Error Code: ${code}`);
      }
    });
  }
  
  uploadStartListener(socket: SocketIO.Socket) {
    return (data: any) => {
      let name = data['name'];
      this.files[name] = {  //Create a new Entry in The Files Variable
        fileSize : data['size'],
        data     : '',
        downloaded : 0
      };
      let place = 0;
      try {
        let stat = fs.statSync('tmp/' +  name);
        if (stat.isFile()) {
          this.files[name]['downloaded'] = stat.size;
          place = stat.size / 524288;
        }
      } catch (er) {} //It's a New File
      fs.open('tmp/' + name, 'a', '0755', (err, fd) => {
        if (err) {
          console.log(err);
        } else {
          this.files[name]['handler'] = fd; //We store the file handler so we can write to it later
          socket.emit('uploadMoreData', { 'place': place, percent: 0, name: name });
        }
      });
    };
  }
  
  uploadListener(socket: SocketIO.Socket) {
  return (data: any) => {
      let name = data['name'];
      this.files[name]['downloaded'] += data['data'].length;
      this.files[name]['data'] += data['data'];
      //If File is Fully Uploaded
      if (this.files[name]['downloaded'] === this.files[name]['fileSize']) {
        fs.write(this.files[name]['handler'], this.files[name]['data'], null, 
          'Binary', (err, writen) => {
            socket.emit('uploadDone', data.name);
            this.installListener('tmp/' + data.name);
        });
      } else if (this.files[name]['data'].length > 10485760) {
        //If the Data Buffer reaches 10MB
        fs.write(this.files[name]['handler'], this.files[name]['data'], null, 
          'Binary', (err, writen) => {
            this.files[name]['data'] = ''; //Reset The Buffer
            let place = this.files[name]['downloaded'] / 524288;
            let percent = (this.files[name]['downloaded'] / 
              this.files[name]['fileSize']) * 100;
            socket.emit('uploadMoreData', 
              {'place': place, 'percent': percent, name: name});
        });
      } else {
          let place = this.files[name]['downloaded'] / 524288;
          let percent = (this.files[name]['downloaded'] / 
            this.files[name]['fileSize']) * 100;
          socket.emit('uploadMoreData', {'place': place, 'percent': percent, name: name});
      }
    };  
  }
  
  mergeConfigs() {
    return this.depManager.initialise()
      .then(this.objectToArray)
      .then(this.checkConfigsforAllDeps.bind(this))
      .then(successInstallation.bind(this), failedInstallation.bind(this));
    
    function successInstallation() {
      this.logger.log(`Installation succesfully completed`);
      this.pluginSystem.restart();
      this.depManager.initialise();
    }
    function failedInstallation(err: any) {
      this.logger.log(`Installation failed`);
      this.logger.log(err);
    }
  }
  
  checkConfigsforAllDeps(deps: any[]): Q.Promise<any> {
    if (deps.length === 0) {
      return;
    }
    let pluginPackage = deps.shift();
    if (pluginPackage.webendConfig) {
      //config object for plugin available
      return this.mergeConfigForPlugin(pluginPackage.name, pluginPackage.webendConfig)
        .then(() => {
          return this.checkConfigsforAllDeps(deps);
        });
    }
    //else: no config object defined by developer -> success
    return this.checkConfigsforAllDeps(deps);
  }
  
  mergeConfigForPlugin(plugin: string, config: any) {
    return this.configuration.readConfigFile().then((conf: any) => {
      if (config && !conf.plugins[plugin]) {
        conf.plugins[plugin] = {};
      }
      this.assignConfigToDefault(config, conf.plugins[plugin]);
      conf.plugins[plugin] = config;
      return this.configuration.writeConfigFile(conf);
    });
  }
  
  assignConfigToDefault(def: any, my: any) {
    if (!def || !my) {
      return;
    }
    let keys = Object.keys(def);
    keys.forEach((key) => {
      if (my[key]) {
        if (typeof def[key] === 'object') {
          this.assignConfigToDefault(def[key], my[key]);
        } else {
          def[key] = my[key];
        }
      }
    });
  }
  
  objectToArray(object: any) {
    let array: any[] = [];
    let keys = Object.keys(object);
    keys.forEach((key) => {
      array.push(object[key]);
    });
    return array;
  }
}
Installation.$inject = {
  deps: ['websocket', 'logger', 'pluginSystem', 'depManager', 'configuration'],
  callAs: 'class'
};
