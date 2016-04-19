import {Component, OnInit} from 'angular2/core';
import {Websocket} from '../../services/websocket';
import {RouteParams} from 'angular2/router';

@Component({
  selector: 'configuration',
  template: require('./configuration.html')
})
export class ConfigurationComponent implements OnInit{
  public data: any;
  constructor(private routeParams: RouteParams, private websocket: Websocket) {
    console.log('constr')
  }
  
  /**
   * evaluate route parameter in onInit for better testability
   */
  ngOnInit() {console.log('init')
    this.websocket.socket.on('getPluginConfig', (data: any) => {
      this.data = data;
      this.prepareConfigForDisplay(data.config);
      this.prepareAuthorsForDisplay();
      console.log(data);
    });
    this.websocket.socket.emit('getPluginConfig', this.routeParams.get('plugin'));
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
        object: isObject
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
        } catch(err) {
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
    try{
      JSON.parse(model.value);
      model.invalid = false;
    } catch(e) {
      model.invalid = true;
    }
  }
}