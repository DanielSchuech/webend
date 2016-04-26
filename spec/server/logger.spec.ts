///<reference path="../../typings/main.d.ts" />
import {Logger} from '../../build/server/logger';

describe('Server - Logger:', () => {
  let logger: Logger;
  
  beforeEach(() => {
    logger = new Logger();
  });
  
  it('adds log to history', () => {
    logger.log('abc');
    expect(removeDate(logger.getHistory())).toEqual('abc\n');
  });
  
  it('removes multiple new line at end', () => {
    logger.log('abc\n\n\n');
    expect(removeDate(logger.getHistory())).toEqual('abc\n')
  });
  
  it('calls added listener', (done) => {
    function testFn(s: string) {
      expect(removeDate(s)).toEqual('abc\n');
      done();
    }
    logger.addListener(testFn);
    logger.log('abc');
  });
  
});

function removeDate(s: string) {
  return s.substring(21, s.length);
}
