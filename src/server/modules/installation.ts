import TinyDiInjectable from '../tinydiinjectable';
import {Logger} from '../logger';
import PluginSystem from '../extensions/pluginsystem'
import * as child_process from 'child_process';
import * as fs from 'fs';

import {DependencyManager} from '../../pluginsystem/depmanager';

export default class Installation extends TinyDiInjectable {
  private files: any = {}; //Files that are currently uploading
  
  constructor(private websocket: SocketIO.Server, private logger: Logger,
      private pluginSystem: PluginSystem, private depManager: DependencyManager) {
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
    params.unshift('install');
    params.unshift('--save');
    
    //spawn ignores PATHEXT on windows -> use cmd
    //https://github.com/nodejs/node-v0.x-archive/issues/2318
    let options: any = {};
    if (process.platform === 'win32') {
      options.shell = true;
    }
    
    let child = child_process.spawn('npm', params, options);
    child.stdout.on('data', (data: any) => {this.logger.log(`${data}`)});
    child.stderr.on('data', (data: any) => {this.logger.log(`${data}`)});
    
    child.on('close', (code: number) => {
      if (code === 0) {
        //Installation successful
        this.logger.log(`Installation of ${npmPackage} succesfully completed`);
        this.pluginSystem.restart();
        this.depManager.initialise();
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
        data     : "",
        downloaded : 0
      }
      let place = 0;
      try {
        let stat = fs.statSync('tmp/' +  name);
        if (stat.isFile()) {
          this.files[name]['downloaded'] = stat.size;
          place = stat.size / 524288;
        }
      }
      catch (er) {} //It's a New File
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
          'Binary', (err, Writen) => {
            socket.emit('uploadDone', data.name);
            this.installListener('tmp/' + data.name);
        });
      }
      //If the Data Buffer reaches 10MB
      else if (this.files[name]['data'].length > 10485760) {
        fs.write(this.files[name]['handler'], this.files[name]['data'], null, 
          'Binary', (err, Writen) => {
            this.files[name]['data'] = ""; //Reset The Buffer
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
  
}
Installation.$inject = {
  deps: ['websocket', 'logger', 'pluginSystem', 'depManager'],
  callAs: 'class'
};
