///<reference path="../../typings/main.d.ts" />
import {Logger} from '../../build/server/logger';

describe('Server - Logger:', () => {
  let logger: Logger;
  
  beforeEach(() => {
    logger = new Logger();
    //Dont add date in tests
    logger.addDate = (s: string) => {return s; }
  });
  
  it('adds log to history', () => {
    logger.log('abc');
    expect(logger.getHistory()).toEqual('abc\n');
  });
  
  it('removes multiple new line at end', () => {
    logger.log('abc\n\n\n');
    expect(logger.getHistory()).toEqual('abc\n')
  });
  
  it('calls added listener', (done) => {
    function testFn(s: string) {
      expect(s).toEqual('abc\n');
      done();
    }
    logger.addListener(testFn);
    logger.log('abc');
  });
  
});
