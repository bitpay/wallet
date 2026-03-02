import { LoadingController } from 'ionic-angular';
import { TestUtils } from '../../test';
import { Logger } from '../logger/logger';
import { OnGoingProcessProvider } from './on-going-process';

describe('OnGoingProcessProvider', () => {
  let onGoingProcessProvider: OnGoingProcessProvider;
  let loadingCtrl: LoadingController;
  let logger: Logger;
  let loggerSpy;
  let setSpy;

  beforeEach(() => {
    const testBed = TestUtils.configureProviderTestingModule();
    onGoingProcessProvider = testBed.get(OnGoingProcessProvider);
    logger = testBed.get(Logger);
    loadingCtrl = testBed.get(LoadingController);
    loggerSpy = spyOn(logger, 'warn');
  });

  describe('set', () => {
    it('should set loading content with the translation of the process code', () => {
      onGoingProcessProvider.set('signingTx');
      onGoingProcessProvider.set('broadcastingTx');
      expect(loadingCtrl.create).toHaveBeenCalledTimes(1);
      onGoingProcessProvider.clear();
    });

    it('should set loading content even if does not match with any process code', () => {
      onGoingProcessProvider.set('rareProcessCode');
      expect(loadingCtrl.create).toHaveBeenCalledTimes(1);
      onGoingProcessProvider.clear();
    });
  });

  describe('clear', () => {
    it('should show a warning log if no ongoing process active', () => {
      onGoingProcessProvider.clear();
      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('resume', () => {
    it('should resume correctly paused processes', () => {
      onGoingProcessProvider.set('signingTx');
      onGoingProcessProvider.pause();
      setSpy = spyOn(onGoingProcessProvider, 'set');
      onGoingProcessProvider.resume();
      expect(setSpy).toHaveBeenCalledWith('signingTx');
      expect(loadingCtrl.create).toHaveBeenCalledTimes(1);
    });
  });
});
