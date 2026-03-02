import { Logger } from '../../providers/logger/logger';
import { TestUtils } from '../../test';

describe('LoggerProvider', () => {
  let service: Logger;

  beforeEach(() => {
    const testBed = TestUtils.configureProviderTestingModule();
    service = testBed.get(Logger);
  });

  it('should be able use optional params for errors', () => {
    service.error(
      'So long and thanks for all the fish!',
      'dolphins',
      'mice',
      'humans'
    );
  });

  it('should be able use optional params for debug', () => {
    service.debug(
      'The answer to life, the universe, and everything is 42.',
      'dolphins',
      'mice',
      'humans'
    );
  });

  it('should be able use optional params for warnings', () => {
    service.warn('Mostly harmless', 'dolphins', 'mice', 'humans');
  });

  it('should be able use optional params for info', () => {
    service.info(
      "Who's going to dinner at the restaurant at the end of the universe?",
      'Arthur',
      'Zaphod',
      'Trillian'
    );
  });

  it('should get levels', () => {
    const levels = service.getLevels();
    expect(levels).toEqual([
      { level: 'error', weight: 1, label: 'Error', def: false },
      { level: 'warn', weight: 2, label: 'Warning', def: false },
      { level: 'info', weight: 3, label: 'Info', def: true },
      { level: 'debug', weight: 4, label: 'Debug', def: false }
    ]);
  });

  it('should get weight', () => {
    let weight = service.getWeight(1);
    expect(weight).toEqual({
      level: 'error',
      weight: 1,
      label: 'Error',
      def: false
    });
    weight = service.getWeight(2);
    expect(weight).toEqual({
      level: 'warn',
      weight: 2,
      label: 'Warning',
      def: false
    });
    weight = service.getWeight(3);
    expect(weight).toEqual({
      level: 'info',
      weight: 3,
      label: 'Info',
      def: true
    });
    weight = service.getWeight(4);
    expect(weight).toEqual({
      level: 'debug',
      weight: 4,
      label: 'Debug',
      def: false
    });
  });

  it('should get the default weight', () => {
    const defaultWeight = service.getDefaultWeight();
    expect(defaultWeight).toEqual({
      level: 'info',
      weight: 3,
      label: 'Info',
      def: true
    });
  });

  it('should get logs by filtered weight', () => {
    let filteredLogs;

    service.debug('Heart of Gold');
    service.debug('Volgon ship');
    filteredLogs = service.get(4);
    expect(filteredLogs.length).toBe(2);

    service.info("Don't panic");
    service.info('Take peanuts');
    service.info("Don't forget a towel");
    filteredLogs = service.get(3);
    expect(filteredLogs.length).toBe(3);

    service.error('Planet not found');
    filteredLogs = service.get(1);
    expect(filteredLogs.length).toBe(1);
  });

  it('should get logs when not filtered by weight', () => {
    service.warn('Beware the Bugblatter Beast of Traal');
    service.error('Heart of Gold has been stolen');
    service.info('Zaphod is President');
    service.debug('Marvin is depressed');

    const logs = service.get();

    expect(logs[0].msg).toEqual('Beware the Bugblatter Beast of Traal');
    expect(logs[1].msg).toEqual('Heart of Gold has been stolen');
    expect(logs[2].msg).toEqual('Zaphod is President');
    expect(logs[3].msg).toEqual('Marvin is depressed');
  });

  it('should process args', () => {
    let processedArgs = service.processingArgs([
      'bulldozer',
      'bathrobe',
      'satchel'
    ]);
    expect(processedArgs).toEqual('bulldozer bathrobe satchel');

    processedArgs = service.processingArgs('babel fish');
    expect(processedArgs).toEqual('b a b e l   f i s h');

    processedArgs = service.processingArgs(['babel', undefined, 'fish']);
    expect(processedArgs).toEqual('babel undefined fish');

    processedArgs = service.processingArgs(['babel', false, 'fish']);
    expect(processedArgs).toEqual('babel false fish');

    processedArgs = service.processingArgs(['babel', 0, 'fish']);
    expect(processedArgs).toEqual('babel 0 fish');

    processedArgs = service.processingArgs([
      'babel',
      { message: 'Save the Humans' },
      'fish'
    ]);
    expect(processedArgs).toEqual('babel {"message":"Save the Humans"} fish');

    processedArgs = service.processingArgs([
      'babel',
      { improbability: 'infinite' },
      'fish'
    ]);
    expect(processedArgs).toEqual('babel {"improbability":"infinite"} fish');

    // cyclical reference; yeah, baby! to break JSON.stringify
    const a = { b: { a: {} } };
    a.b.a = a;
    processedArgs = service.processingArgs(['babel', a, 'fish']);
    expect(processedArgs).toEqual('babel Unknown message fish');
  });
});
