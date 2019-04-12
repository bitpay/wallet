import { File } from '@ionic-native/file';
import { Logger } from '../../providers/logger/logger';
import { PlatformProvider } from '../platform/platform';
import { PersistenceProvider } from './persistence';

class FileMock extends File {}

describe('Persistence Provider', () => {
  let persistenceProvider: PersistenceProvider;
  let logs;

  const loggerMock = {
    info: info => {
      logs.push(info);
    },
    debug: info => {
      logs.push(info);
    }
  } as Logger;
  const platformMock = {} as PlatformProvider;
  const fileMock = new FileMock();

  beforeEach(() => {
    logs = [];
  });

  function createAndLoad() {
    persistenceProvider = new PersistenceProvider(
      loggerMock,
      platformMock,
      fileMock
    );
    persistenceProvider.load();
  }

  describe('When platform is Cordova', () => {
    beforeEach(() => {
      platformMock.isCordova = true;
      createAndLoad();
    });
    it('should use the FileStorage provider', () => {
      expect(persistenceProvider.storage.constructor.name).toBe('FileStorage');
    });
  });

  describe('without local storage', () => {
    let localStorageBackup;

    beforeEach(() => {
      localStorageBackup = window.localStorage;
      Object.defineProperties(window, {
        localStorage: {
          value: null,
          writable: true
        }
      });
    });

    afterEach(() => {
      Object.defineProperties(window, {
        localStorage: {
          value: localStorageBackup,
          writable: false
        }
      });
    });

    it('should throw an error if local storage is not available', () => {
      expect(() => {
        platformMock.isCordova = false;
        createAndLoad();
      }).toThrow(new Error('localstorage not available'));
    });
  });

  describe('When platform is not Cordova', () => {
    beforeEach(() => {
      platformMock.isCordova = false;
      createAndLoad();
    });
    it('should use the LocalStorage provider', () => {
      expect(persistenceProvider.storage.constructor.name).toBe('LocalStorage');
    });
    it('should correctly perform a profile roundtrip', done => {
      const p = { name: 'My profile' };
      persistenceProvider
        .storeNewProfile(p)
        .catch(err => expect(err).toBeNull)
        .then(() => {
          return persistenceProvider.getProfile();
        })
        .then(profile => {
          expect(typeof profile).toEqual('object');
          expect(profile.name).toEqual('My profile');
        })
        .then(done);
    });

    it('should fail to create a profile when one already exists', () => {
      const p = { name: 'My profile' };
      persistenceProvider
        .storeNewProfile(p)
        .then(() => {
          return persistenceProvider.storeNewProfile(p);
        })
        .catch(err => {
          expect(err.message).toEqual('Key already exists');
        });
    });

    it('should store profile', done => {
      const p = { name: 'My profile' };
      persistenceProvider
        .storeProfile(p)
        .catch(err => expect(err).toBeNull)
        .then(() => {
          return persistenceProvider.getProfile();
        })
        .then(profile => {
          expect(typeof profile).toEqual('object');
          expect(profile.name).toEqual('My profile');
        })
        .then(done);
    });

    it('should set and get wallet order', done => {
      const walletId: string = '647b39d8-a88c-42d5-8728-0ba898dcdd90';
      const order: number = 1;
      persistenceProvider
        .setWalletOrder(walletId, order)
        .catch(err => expect(err).toBeNull)
        .then(() => {
          return persistenceProvider.getWalletOrder(walletId);
        })
        .then(order => {
          expect(typeof order).toEqual('number');
        })
        .then(done);
    });

    it('should remove wallet order', done => {
      const walletId: string = '647b39d8-a88c-42d5-8728-0ba898dcdd90';
      const order: number = 1;
      persistenceProvider
        .setWalletOrder(walletId, order)
        .catch(err => expect(err).toBeNull)
        .then(() => {
          persistenceProvider.removeWalletOrder(walletId).then(() => {
            return persistenceProvider.getWalletOrder(walletId);
          });
        })
        .then(order => {
          expect(typeof order).toEqual('undefined');
        })
        .then(done);
    });
  });
});
