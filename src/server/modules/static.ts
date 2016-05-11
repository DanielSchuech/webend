import TinyDiInjectable from '../tinydiinjectable';
import * as express from 'express';
import * as path from 'path';

export default class Static extends TinyDiInjectable {
  constructor(server: express.Express) {
    super();
    let indexFile = path.normalize(__dirname + '/../../controlapp/index.html');
    let bundleFile = path.normalize(__dirname + '/../../controlapp/bundle.js');
    let cssFile = path.normalize(__dirname + '/../../controlapp/main.css');
    let fontDir = path.normalize(__dirname + '/../../controlapp/fonts/');
    
    server.get('/bundle.js', (req, res) => {
      res.sendFile(bundleFile);
    });
    
    server.get('/main.css', (req, res) => {
      res.sendFile(cssFile);
    });
    
    //resolve glyphicons fonts
    server.get('/fonts/:font', function(req, res) {
      res.sendFile(fontDir + req.params.font);
    });

    server.get('/*', (req, res) => {
      res.sendFile(indexFile);
    });
  }
}
Static.$inject = {
  deps: ['server'],
  callAs: 'class'
};
