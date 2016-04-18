import TinyDiInjectable from '../tinydiinjectable';
import {Logger} from '../logger';

export default class LoggerRequests extends TinyDiInjectable{
  constructor(private websocket: SocketIO.Server, private logger: Logger) {
    super();
    
    logger.addListener(this.newLogHandler.bind(this));
    
    websocket.on('connection', (client) => {
      this.registerRoutesForClient(client);
    });
  }
  
  /**
   * add routes in socket.io for different request
   */
  registerRoutesForClient(client: SocketIO.Socket) {
    client.on('getLogs', () => {
      client.emit('getLogs', this.logger.getHistory());
    });
  }
  
  /**
   * add handler in logger for new logs
   * broadcast new log to all connected sockets
   */
  newLogHandler(s: string) {
    this.websocket.emit('newLog', s);
  }
}
LoggerRequests.$inject = {
  deps: ['websocket', 'logger'],
  callAs: 'class'
}
