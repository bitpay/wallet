import { TestUtils } from '../../test';
import { Logger } from '../logger/logger';
import { PersistenceProvider } from '../persistence/persistence';
import { TxConfirmNotificationProvider } from './tx-confirm-notification';

describe('TxConfirmNotificationProvider', () => {
  let txConfirmNotificationProvider: TxConfirmNotificationProvider;
  let persistenceProvider: PersistenceProvider;
  let logger: Logger;

  const walletMock = {
    credentials: {
      coin: 'btc',
      network: 'livenet',
      n: 1,
      m: 1,
      walletId: 'id1'
    },
    txConfirmationSubscribe: (_opts, _cb) => {
      return _cb(new Error());
    },
    txConfirmationUnsubscribe: (_opts, _cb) => {
      return _cb(new Error());
    }
  };

  beforeEach(() => {
    const testBed = TestUtils.configureProviderTestingModule();
    txConfirmNotificationProvider = testBed.get(TxConfirmNotificationProvider);
    persistenceProvider = testBed.get(PersistenceProvider);
    logger = testBed.get(Logger);
  });

  describe('checkIfEnabled function', () => {
    it('should reject an error if getTxConfirmation function fails', () => {
      spyOn(persistenceProvider, 'getTxConfirmNotification').and.returnValue(
        Promise.reject('Error')
      );
      txConfirmNotificationProvider
        .checkIfEnabled('txidTest')
        .catch(err => expect(err).toBeDefined());
    });
    it('should return value if getTxConfirmation function works as expected', () => {
      spyOn(persistenceProvider, 'getTxConfirmNotification').and.returnValue(
        Promise.resolve()
      );
      txConfirmNotificationProvider
        .checkIfEnabled('txidTest')
        .then(res => {
          expect(res).toBeDefined();
        })
        .catch(err => expect(err).toBeUndefined());
    });
  });

  describe('subscribe function', () => {
    it('should try to subscribe and show logger error if something is wrong', () => {
      const loggerSpy = spyOn(logger, 'error');
      spyOn(persistenceProvider, 'setTxConfirmNotification').and.returnValue(
        Promise.reject('Error')
      );
      txConfirmNotificationProvider.subscribe(walletMock, { txid: 'txid1' });
      expect(loggerSpy).toHaveBeenCalled();
    });
    it('should subscribe a client', () => {
      const setTxConfirmNotificationSpy = spyOn(
        persistenceProvider,
        'setTxConfirmNotification'
      ).and.returnValue(Promise.resolve());
      txConfirmNotificationProvider.subscribe(walletMock, { txid: 'txid1' });
      expect(setTxConfirmNotificationSpy).toHaveBeenCalled();
    });
  });

  describe('unsubscribe function', () => {
    it('should try to subscribe and show logger error if something is wrong', () => {
      const loggerSpy = spyOn(logger, 'error');
      spyOn(persistenceProvider, 'removeTxConfirmNotification').and.returnValue(
        Promise.reject('Error')
      );
      txConfirmNotificationProvider.unsubscribe(walletMock, 'txid1');
      expect(loggerSpy).toHaveBeenCalled();
    });
    it('should unsubscribe a client', () => {
      const removeTxConfirmNotificationSpy = spyOn(
        persistenceProvider,
        'removeTxConfirmNotification'
      ).and.returnValue(Promise.resolve());
      txConfirmNotificationProvider.unsubscribe(walletMock, 'txid1');
      expect(removeTxConfirmNotificationSpy).toHaveBeenCalled();
    });
  });
});
