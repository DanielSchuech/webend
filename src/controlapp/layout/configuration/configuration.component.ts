import {Component, OnInit, OnDestroy} from '@angular/core';
import {Websocket} from '../../services/websocket';
import {RouteParams} from '@angular/router-deprecated';

@Component({
  selector: 'configuration',
  template: require('./configuration.html')
})
export class ConfigurationComponent implements OnInit, OnDestroy {
  public data: any;
  constructor(private routeParams: RouteParams, private websocket: Websocket) {}
  
  /**
   * evaluate route parameter in onInit for better testability
   */
  ngOnInit() {
    this.websocket.socket.on('getPluginConfig', this.pluginConfigListener);
    this.websocket.socket.emit('getPluginConfig', this.routeParams.get('plugin'));
  }
  
  ngOnDestroy() {
    this.websocket.socket.removeListener('getPluginConfig', this.pluginConfigListener);
  }
  
  /**
   * websocket listener for incomming plugin config
   */
  pluginConfigListener = this._pluginConfigListener.bind(this);
  _pluginConfigListener(data: any) {
    this.data = data;
    this.prepareConfigForDisplay(data.config);
    this.prepareAuthorsForDisplay();
  }
  
  /**
   * convert config object to array of key-value pairs
   */
  prepareConfigForDisplay(config: any) {
    if (!config) {
      return;
    }
    this.data.config = [];
    let keys = Object.keys(config);
    keys.forEach((option) => {
      let isObject = typeof config[option] === 'object';
      this.data.config.push({
        key: option,
        value: isObject ? JSON.stringify(config[option], null , 2) : config[option],
        object: isObject,
        multilineString: (typeof config[option] === 'string' && 
          config[option].indexOf('\n') !== -1)
      });
    });
  }
  
  /**
   * possible author declarations:
   * author: 'abc'
   * author: {name: 'abc', email: 'blabla'}
   * author: ['abc', 'def']
   * author: [{name: 'abc', ...}, {...}, ...]
   * convert that they can be displayed
   */
  prepareAuthorsForDisplay() {
    let myAuthors: string[] = [];
    let author = this.data.info.author;
    
    if (typeof author === 'string') {
      myAuthors.push(author);
    } else if (!Array.isArray(author)) {
      myAuthors.push(author.name);
    } else {
      author.forEach((a: any) => {
        if (typeof a === 'string') {
          myAuthors.push(a);
        } else {
          myAuthors.push(a.name);
        }
      });
    }
    
    this.data.info.author = myAuthors;
  }
  
  save() {
    //collect config data
    let config: any = {};
    let valid = true;
    this.data.config.forEach((setting: any) => {
      if (!setting.object) {
        config[setting.key] = setting.value;
      } else {
        try {
          config[setting.key] = JSON.parse(setting.value);
        } catch (err) {
          console.log('Error on reading setting ' + setting.name);
          console.log(err);
          valid = false;
        }
      }
    });

    if (valid) {
      this.websocket.socket.emit('savePluginConfig', this.data.info.name, config);
    }
  }
  
  checkTextareaValidity(model: any) {
    if (model.ibject) {
      try {
        JSON.parse(model.value);
        model.invalid = false;
      } catch (e) {
        model.invalid = true;
      }
    }
  }
}
