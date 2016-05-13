import TinyDiInjectable from './tinydiinjectable';
import * as express from 'express';

export default class Testpage extends TinyDiInjectable {
  constructor(private app: express.Express) {
    super();
  }
  
  start() {
    this.app.get('/testpage', (req, res) => {
      res.send('Testpage');
    });
  }
}
Testpage.$inject = {
  deps: ['webend_server_app'],
  callAs: 'class'
};
