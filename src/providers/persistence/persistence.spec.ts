import { fakeAsync, tick } from '@angular/core/testing';
import { File } from '@ionic-native/file';
import { Events } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';
import { TestUtils } from '../../test';
import { PlatformProvider } from '../platform/platform';
import { PersistenceProvider } from './persistence';

class FileMock extends File {}

describe('Persistence Provider', () => {
  let events: Events;
  let logger: Logger;
  let persistenceProvider: PersistenceProvider;

  const platformMock = {} as PlatformProvider;
  const fileMock = new FileMock();

  beforeEach(() => {
    const testBed = TestUtils.configureProviderTestingModule([]);
    logger = testBed.get(Logger);
    events = testBed.get(Events);
  });

  function createAndLoad() {
    persistenceProvider = new PersistenceProvider(
      logger,
      platformMock,
      fileMock,
      events
    );
    persistenceProvider.load();
  }

  function getPersistentLogsMock() {
    const persistentLogs = {};
    for (let i = 0; i < 4; i++) {
      // get the current date & time
      let dateObj = Date.now();
      dateObj += 1000 + i;
      let date = new Date(dateObj).toISOString();
      persistentLogs[date] = {
        level: 'debug',
        msg: 'Debug message'
      };
    }
    return persistentLogs;
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
      let p = { name: 'My profile' };
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
      let p = { name: 'My profile' };
      persistenceProvider
        .storeNewProfile(p)
        .then(() => {
          return persistenceProvider.storeNewProfile(p);
        })
        .catch(err => {
          expect(err.message).toEqual('Key already exists');
        });
    });

    it('should be able to delete a profile', done => {
      let p = { name: 'My profile' };
      persistenceProvider
        .storeNewProfile(p)
        .catch(err => expect(err).toBeNull)
        .then(() => {
          return persistenceProvider.getProfile();
        })
        .then(profile => {
          expect(typeof profile).toEqual('object');
          expect(profile.name).toEqual('My profile');
          return persistenceProvider.deleteProfile();
        })
        .then(() => {
          return persistenceProvider.getProfile();
        })
        .then(profile => {
          expect(profile).toBeNull();
        })
        .then(done);
    });

    it('should store profile', done => {
      let p = { name: 'My profile' };
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

    describe('getPersistentLogs', () => {
      const persistentLogs = getPersistentLogsMock();

      it('should call getLogs and do not break if get a correct JSON', fakeAsync(() => {
        const spyGetLogs = spyOn(
          persistenceProvider,
          'getLogs'
        ).and.returnValue(Promise.resolve(persistentLogs));

        const spyDeleteOldLogs = spyOn(persistenceProvider, 'deleteOldLogs');

        persistenceProvider.getPersistentLogs();
        tick();
        expect(spyGetLogs).toHaveBeenCalled();
        expect(spyDeleteOldLogs).toHaveBeenCalledWith(persistentLogs);
      }));

      it('should call getLogs and do not break if get a correct string', fakeAsync(() => {
        const stringifiedLogs = JSON.stringify(persistentLogs);

        const spyGetLogs = spyOn(
          persistenceProvider,
          'getLogs'
        ).and.returnValue(Promise.resolve(stringifiedLogs));

        const spyDeleteOldLogs = spyOn(persistenceProvider, 'deleteOldLogs');

        persistenceProvider.getPersistentLogs();
        tick();
        expect(spyGetLogs).toHaveBeenCalled();
        expect(spyDeleteOldLogs).toHaveBeenCalledWith(persistentLogs);
      }));

      it('should call getLogs and do not break if get a broken string', fakeAsync(() => {
        const spyGetLogs = spyOn(
          persistenceProvider,
          'getLogs'
        ).and.returnValue(Promise.resolve('broken"JSON'));

        const spyDeleteOldLogs = spyOn(persistenceProvider, 'deleteOldLogs');

        persistenceProvider.getPersistentLogs();
        tick();
        expect(spyGetLogs).toHaveBeenCalled();
        expect(spyDeleteOldLogs).toHaveBeenCalledWith({});
      }));

      it('should call getLogs and do not break if get an array', fakeAsync(() => {
        const spyGetLogs = spyOn(
          persistenceProvider,
          'getLogs'
        ).and.returnValue(Promise.resolve([]));

        const spyDeleteOldLogs = spyOn(persistenceProvider, 'deleteOldLogs');

        persistenceProvider.getPersistentLogs();
        tick();
        expect(spyGetLogs).toHaveBeenCalled();
        expect(spyDeleteOldLogs).toHaveBeenCalledWith({});
      }));

      it('should get an error message when spyGetLogs fails', fakeAsync(() => {
        const spyGetLogs = spyOn(
          persistenceProvider,
          'getLogs'
        ).and.returnValue(Promise.reject('Error message'));

        const spyErrorLogger = spyOn(logger, 'error');
        const spyDeleteOldLogs = spyOn(persistenceProvider, 'deleteOldLogs');

        persistenceProvider.getPersistentLogs();
        tick();
        expect(spyGetLogs).toHaveBeenCalled();
        expect(spyDeleteOldLogs).not.toHaveBeenCalledWith({});
        expect(spyErrorLogger).toHaveBeenCalledWith('Error message');
      }));
    });

    describe('checkLogsConfig', () => {
      let config = {
        persistentLogsEnabled: true
      };

      it('should do nothing if persistentLogsEnabled is true', () => {
        persistenceProvider.checkLogsConfig(config);
        expect().nothing;
      });

      it('should do nothing if there is no config', () => {
        config = null;
        persistenceProvider.checkLogsConfig(config);
        expect().nothing;
      });

      it('shouldcall unsubscribe function if persistentLogsEnabled exists and is false', () => {
        config = {
          persistentLogsEnabled: false
        };
        const spyUnsubscribe = spyOn(events, 'unsubscribe');

        persistenceProvider.checkLogsConfig(config);
        expect(spyUnsubscribe).toHaveBeenCalledWith('newLog');
      });
    });

    describe('deleteOldLogs', () => {
      let persistentLogs = getPersistentLogsMock();
      it('should return the same logs if there is nothing to delete', () => {
        let deletedPersistentLogs = persistenceProvider.deleteOldLogs(
          persistentLogs
        );
        expect(deletedPersistentLogs).toEqual(persistentLogs);
      });

      it('should return the correct logs after delete old ones', () => {
        persistentLogs['2017-10-24T17:44:29.740Z'] = {
          level: 'debug',
          msg: 'Old log 1'
        };
        persistentLogs['2018-02-24T17:44:29.740Z'] = {
          level: 'debug',
          msg: 'Old log 2'
        };
        persistentLogs['2017-10-24T18:44:29.740Z'] = {
          level: 'debug',
          msg: 'Old log 3'
        };
        expect(Object.keys(persistentLogs).length).toEqual(7);

        let deletedPersistentLogs = persistenceProvider.deleteOldLogs(
          persistentLogs
        );
        expect(Object.keys(deletedPersistentLogs).length).toEqual(4);
      });

      it('should return the correct number of logs after removing the excess', () => {
        persistentLogs = {};

        for (let i = 0; i < 2200; i++) {
          persistentLogs[2018 + i + '-10-24T17:44:29.740Z'] = {
            level: 'debug',
            msg: 'Msg'
          };
        }

        expect(Object.keys(persistentLogs).length).toEqual(2200);
        let deletedPersistentLogs = persistenceProvider.deleteOldLogs(
          persistentLogs
        );
        expect(Object.keys(deletedPersistentLogs).length).toEqual(2000);
      });
    });

    describe('persistentLogsChange', () => {
      it('should call subscribe events if persistentLogsChange is enabled', fakeAsync(() => {
        const spySubscribe = spyOn(events, 'subscribe');
        persistenceProvider.persistentLogsChange(true);
        tick();
        expect(spySubscribe).toHaveBeenCalled();
      }));

      it('should call unsubscribe events if persistentLogsChange is disabled', () => {
        const spyUnsubscribe = spyOn(events, 'unsubscribe');
        persistenceProvider.persistentLogsChange(false);
        expect(spyUnsubscribe).toHaveBeenCalledWith('newLog');
      });
    });

    describe('saveNewLog', () => {
      let persistentLogs;
      let spyGetLogs;
      let dateObj = Date.now();
      let newLog = {
        timestamp: new Date((dateObj += 1000 * 60)).toISOString(),
        level: 'debug',
        msg: 'Debug message'
      };

      describe('when logsLoaded is true', () => {
        beforeEach(fakeAsync(() => {
          persistentLogs = getPersistentLogsMock();

          spyGetLogs = spyOn(persistenceProvider, 'getLogs').and.returnValue(
            Promise.resolve(persistentLogs)
          );

          persistenceProvider.getPersistentLogs();
          tick();
          expect(spyGetLogs).toHaveBeenCalled();
        }));

        it('should call setLogs function with the correct stringified logs', () => {
          const spySetLogs = spyOn(
            persistenceProvider,
            'setLogs'
          ).and.returnValue(Promise.resolve());

          persistenceProvider.saveNewLog(newLog);
          const stringifiedPersistentLogs = JSON.stringify(persistentLogs);
          expect(spySetLogs).toHaveBeenCalledWith(stringifiedPersistentLogs);
        });

        it('should call unsubscribe event if setLogs function fails', fakeAsync(() => {
          const spySetLogs = spyOn(
            persistenceProvider,
            'setLogs'
          ).and.returnValue(Promise.reject('Error'));
          const spyUnsubscribe = spyOn(events, 'unsubscribe');

          persistenceProvider.saveNewLog(newLog);
          const stringifiedPersistentLogs = JSON.stringify(persistentLogs);
          tick();
          expect(spySetLogs).toHaveBeenCalledWith(stringifiedPersistentLogs);
          expect(spyUnsubscribe).toHaveBeenCalledWith('newLog');
        }));
      });

      describe('when logsLoaded is false', () => {
        it('should not call setLogs function ', () => {
          const spySetLogs = spyOn(persistenceProvider, 'setLogs');
          persistenceProvider.saveNewLog(newLog);
          expect(spySetLogs).not.toHaveBeenCalled();
        });
      });
    });
  });
});
