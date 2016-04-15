import TinyDiInjectable from '../../server/tinydiinjectable';
import * as express from 'express';

export default class Testpage extends TinyDiInjectable {
  constructor(app: express.Express) {
    super();
    
    app.get('/testpage', (req, res) => {
      res.send('Testpage');
    });
  }
}
Testpage.$inject = {
  deps: ['webend_server_app'],
  callAs: 'class'
};