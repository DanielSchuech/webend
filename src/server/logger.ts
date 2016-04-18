export class Logger {
  private history: string = '';
  private listener: Function[] = [];
  
  log(s: string) {
    //remove existing new lines and add only one
    s = this.removeNewLines(s) + '\n';
    
    //add date
    let date = new Date().toLocaleString();
    s = date + ': ' + s;
    
    this.history += s;
    this.fireAllListener(s);
  }
  
  addListener(fn: Function) {
    this.listener.push(fn);
  }
  
  fireAllListener(s: string) {
    this.listener.forEach((fn) => {
      fn(s);
    })
  }
  
  getHistory() {
    return this.history;
  }
  
  removeNewLines(s: string) {
    return s.replace(/(\n|\r)+$/, '');
  }
}