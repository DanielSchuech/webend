import TinyDiInjectable from '../tinydiinjectable';
import * as express from 'express';
import * as path from 'path';

export default class Static extends TinyDiInjectable {
  constructor(server: express.Express) {
    super();
    let indexFile = path.normalize(__dirname + '/../../controlapp/index.html');
    let bundleFile = path.normalize(__dirname + '/../../controlapp/bundle.js');
    let cssFile = path.normalize(__dirname + '/../../controlapp/main.css');
    
    server.get('/bundle.js', (req, res) => {
      res.sendFile(bundleFile);
    });
    
    server.get('/main.css', (req, res) => {
      res.sendFile(cssFile);
    });

    server.get('/*', (req, res) => {
      res.sendFile(indexFile);
    });
  }
}
Static.$inject = {
  deps: ['server'],
  callAs: 'class'
}
