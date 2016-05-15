[![Build Status](https://travis-ci.org/DanielSchuech/webend.svg?branch=master)](https://travis-ci.org/DanielSchuech/webend)

# Everything is a Plugin

Webend is a web wide plugin system.
A feature often consists of frontend and backend part.
Combine both and develop each feature as plugin to keep it easily, maintainable und testable.
Support easily different product lines for different customers.

## Installation
```
npm i -save webend webend_hub
```
The system is devided into two parts: `webend` & `webend_hub`. 
The `webend` will load the NodeJS backend plugins while the `webend_hub` will 
connect all frontend plugins. To support front- and backend you have to install both

## Setup
Just import the webend package.
```
import 'webend';  //require('webend');
```

Before we can start the system we have to configure the path for a secret wich will be used for 
the encryption of the control page.
Therefor edit the `node_modules/webend/build/config.json`.
Change `privateKeyPath` to your local private key. (The file could contain just a string.)
There you can also change the port of the control page.

Define a user with a password in `node_modules/webend/build/users.json`.
These accounts will be able to login into the control app.

Now you can start your module!

## Control App
Open [localhost:8080](http://localhost:8080) in the browser and login with your defined user.
The app should be self explaining.
Activate the autostart of `webend_hub`.

## Write a PLUGIN
### 1) Instantiate a new npm package
A plugin is always a npm package. Create a new one with: `npm init`

**The plugin name always has to have `webend_` as prefix!**

### 2) NodeJS Backend Part
The entry point to your backend has to be declared in the `main` field of the package.json.
The given entry file has to export a function(es5) or per default a class(es6/typescript).
The constructor will be fired when the plugin will be loaded. 
So you can put your starting code there. 
Sometimes some initialisations on the class needs to be done.
This could be done also in the constructor and you can move your starting code to
a new start method.
This start method is optional and will be fired after the class has been created.
The given entry will be loaded by an dependency injection framework.
Webend uses [tiny-di](https://www.npmjs.com/package/tiny-di).

There are the following Injectables available:

Name | Type | Description | Example |
--- | --- | --- | --- |
injector | tiny-di | The Injector can be used to bind additional instances to the injector or get instances from the injector. Further methods of the injector can be found in the tiny-di documentation. | injector.get('status') |
status | object | Gets the loading status of the different plugins | status['webend_hub'] -> true |
autostart | object | Gets the autostart setting of the plugins | autostart['webend_hub'] -> true |
config | object | contains the configs for all plugins | config['webend_hub'] -> {port: 8080}  |
{pluginName} | object | Gets the instance of an other plugin which has to be a dependency of the current plugin | n.a. |

Thats a lot of theory so here is an example:
```javascript
import * as express from 'express';
import TinyDiInjectable from './tinydiinjectable';

export default class Server extends TinyDiInjectable {
  constructor(_config: any, injector: TinyDiInjector) {
    let config = _config['webend_server'];
    super();
    
    let app = express();
    
    app.get('/', (req, res) => {
      res.send('Hello World');
    });
    
    injector.bind('webend_server_app').to(app);
    
    let server = app.listen(config.port);
    console.log('started on ' + config.port);
  }
}
Server.$inject = {
  deps: ['config', 'injector'],
  callAs: 'class'
};
```
We create an plugin which creates an express server and makes the app variable 
available for other plugins. To inject dependencies we have to declare the `$inject`
property on the class. Therfore we need to inherit that property from the 
`TinyDiInjectable` class. In es5 you don´t need the TinyDiInjectable class. Its only for
declaration purposes.

The port should be configurable through the Control App. Therefore we change the package.json to:
```
{
  "name": "webend_server",
  "version": "0.0.1",
  "main": "server.js",
  "dependencies": {
    "express": "^4.13.4"
  },
  "webendConfig": {
    "port": "3000"
  }
}
```
The configurations can be injected. We only want the config of you plugin so we use 
`_config['webend_server']` only. We want to export the express instance that other plugins can 
define other routes on it. Thats why we have injected the injector to bind it to 
`webend_server_app` with `injector.bind('webend_server_app').to(app);`. The name should always
contain the current plugin name that there are no naming conflicts between different plugins.

### 3) Frontend Part
The frontend part can be a collection(object) of Angular 2 components, directives, services
or an AngularJS Module. The following browser field has to be added to the package.json:
```
{
  "name": "webend_mypage",
  "browser": {
    "entry": "main",
    "framework": "angular2" //or "angular"
  }
}
```
The entry defines the entry module and should not contain the js extension of the file.
Only the filename is needed. 
As frontend frameworks are currently only angular and angular2 supported.
A plugin can only contain code of one framework but plugins of different frameworks can 
be combined and the `ressources can be shared between different frameworks`!

At first we need to connect one (or mulptiple) directives to the document body.
Therefore we got two different opportunities. 
The automatic modus is the default one.
There we have to create a directive which has the plugin name as selector.
All these directives will be automatically added to the document body.
The second one is the more configurable modus. 
There you have to edit the configuration of the webend_hub. 
Therefore open the controll app, navigate to Management and click on the configure 
button of the webend_hub.
There you can set the `useCustomIndexHtml` to true and edit the `index.html`.
It is fully customizable and you can add your root directive into the body.

Now we want to use ressources of other plugins. 
We start with an Angular 2 plugin and want to use components, directives and services 
of another Angular 2 plugin.

#### Angular 2

For example we implement the plugin `webend_mypage`. 
The requested ressources are defined in another plugin which is a optional dependency 
of webend_mypage. Its optional because will also want be able to load the plugin without
the additional.
The entry file is main.ts which looks like:
```javascript
import { Component, Inject } from '@angular/core';
declare var webend: any;
let MyPageService = webend.getService('MyPageService');

@Component({
  moduleId: module.id,
  selector: 'webend_mypage',
  template: '<span my-highlight>this my page!!!</span> <my-addon></my-addon> {{secret}}',
  directives: [webend.getComponent('my-addon'), webend.getDirective('[my-highlight]')],
  providers: [MyPageService]
})
export class webend_mypageComponent {
  public secret: string;
  constructor(@Inject(MyPageService) myService: any) {
    this.secret = myService.secret;
  }
}
```
The selector for the component is equal to the plugin name so the component will 
be attached to the document body. To use components or directives in your template we
have to push them into the directives array. We can't require them because we don't know
if the plugin is avialable. But we can request a component through webend.getComponent.
This wil lreturn the requested component iff available and otherwise it will return a
component with empty template. So this will never fail and we can use the component in our 
template. The same could be done for a directive. The input of the functions are the
selectors as string.

Nearly the same is also available services. Angular 2 has a dependency tree so you can 
inject thorugh the providers array. They will automatically added to the root injector 
that they are available for all plugins.

AngularJS ressources can also be used. Therefore is an adapter defined on the webend:
`webend.adapter.* `. Have a look to [ngAdapter](https://github.com/DanielSchuech/ngAdapter) 
for usage. Not all AngularJS directives can currently be upgraded! To be able to use optional AngularJS ressources use `getOptNg1Directive` or 
`getOptNg1Service`. Example:
```javascript
webend.adapter.upgradeNg1Directive(webend.getOptNg1Directive('myDirective'));
```

#### AngularJS

Lets have a look to an AngularJS plugin (webend_myng1page):
```javascript
let mod = angular.module('webend_myng1page', [])
  .directive('webendMyng1page', MyNg1Page);

declare var webend: any;

ctrl.$inject = [webend.getOptNg1Service('MyPageService'), '$scope'];
function ctrl(MyPageService: any, $scope: any) {
  $scope.secret = MyPageService.secret;
}

function MyNg1Page() {
  return {
    template: `
      <div>
        Hello from the old AngularJS World!
        {{secret}}
        <div red-light>This is a Highlight!</div>
      </div>
    `,
    controller: ctrl
  };
}

export default mod;
```
We have to create an AngularJS module with the name of the plugin.
The controller of the added directive wants to use a optional AngularJS Service. 
Therfore the Service has be requested thorugh `webend.getOptNg1Service`.
Thereby it will be secured that the service is always available (but could be empty).
The directive uses the redLight directive of another plugin.
This could be defined or not. AngularJS ingores unknown directives so there is no need to
secure that the directive exists.

It is possible to use Angular2 components, directives and services in an AngularJS plugin.
Therefore use the `webend.adapter` to downgrade the specific ressource. Have a look to 
[ngAdapter](https://github.com/DanielSchuech/ngAdapter) for documentation.

#### Dependencies
We always talked about optional Dependencies. Thats a new case which I want to be highlgihted.
If you need plugins as dependency its possible to request them the described way. 
I would recommend that but it is also possible to use them in the standard native way.

#### Summary: additional functions on webend

Name | Return Value | Description
--- | --- | ---
getComponent | Component(Angular2) | Returns the requested component iff available otherwise a component with empty template.
getDirective | Directive(Angular2) | Returns the requested directive iff available otherwise a directive which does nothing.
getService | Service(Angular2) | Returns the requested service iff available otherwise an empty service.
getOptNg1Directive | String | Initialises empty directive if not existent. Returns directive selector.
getOptNg1Service | String | Initialises empty service if not existent. Returns name of service. 
adapter | ngAdapter | Use the ngAdapter to up and downgrade directives and services.
