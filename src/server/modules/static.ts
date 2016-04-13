import TinyDiInjectable from '../tinydiinjectable';
import * as express from 'express';

export default class Static extends TinyDiInjectable {
  constructor(server: express.Express) {
    super();

    server.get('/*', (req, res) => {
      res.send('Hellow World');
    });
  }
}
Static.$inject = {
  deps: ['server'],
  callAs: 'class'
}
