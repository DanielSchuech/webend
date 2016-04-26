import * as q from 'q';

export class LoggerMock {
  public listener: Function[] = [];
  addListener(listener: Function) {
    this.listener.push(listener);
  }
  getHistory() {return 'history'; }
  log() {}
}

export class ExpressMock {
  public registeredRoutes: {[type: string]: string[]} = {};
  public req: any = {
    params: {}
  };
  public res: any= {
    sendFile: () => {}
  };
  
  get(route: string, cb: Function) {
    if (!this.registeredRoutes['GET'])
      this.registeredRoutes['GET'] = [];
    this.registeredRoutes['GET'].push(route);
    cb(this.req, this.res);
  }
}

export class WebSocketMock {
  public clientListener: {[event: string]: Function} = {};
  public clientSocket: any = {
    on: (event: string, cb: Function) => {
      this.clientListener[event] = cb;
    },
    emit: () => {}
  };
  on(event: string, cb: Function) {
    if (event === 'connection') {
      cb(this.clientSocket);
    }
  }
  emit() {}
}

export var childProcessMock: any = {
  events: {},
  spawn: (cmd: string, params: string[]) => {
    let dataCb = (stream: string) => {
      return (event: string, cb: Function) => {
        cb(stream);
      };
    };
    return {
      stdout: {on: dataCb('stdout')},
      stderr: {on: dataCb('stderr')},
      on: (event: string, cb: Function) => {
        childProcessMock.events[event] = cb;
      },
      kill: () => {}
    };
  }
};

export class PluginSystemMock {
  restart() {}
}

export class DepManagerMock {
  initialise() {}
  isInitialised() {}
  getPlugins() {}
}

export var fsMock: any = {
  read() {
    let deffered = q.defer();
    deffered.resolve(JSON.stringify({
      enabled: {
        webend_server: false,
        webend_testpage: false
      },
      plugins: {
        webend_server: {
          port: 3000,
          test: 1234567
        }
      }
    }));
    return deffered.promise;
  },
  
  write() {}
};
