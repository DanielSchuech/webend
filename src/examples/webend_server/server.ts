import * as express from 'express';
import TinyDiInjectable from '../../server/tinydiinjectable';

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
    console.log('started on '+config.port)
  }
}
Server.$inject = {
  deps: ['config', 'injector'],
  callAs: 'class'
};
