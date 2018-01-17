import { TestBed, inject } from '@angular/core/testing';
import { Logger, Level as LoggerLevel } from '@nsalaun/ng-logger';
import { Platform } from 'ionic-angular';
import { } from 'jasmine';

import { PersistenceProvider } from './persistence';
import { IStorage, ISTORAGE } from './storage/istorage';
import { RamStorage } from './storage/ram-storage';
import { LocalStorage } from './storage/local-storage';
import { FileStorage } from './storage/file-storage';

describe('Storage Service', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PersistenceProvider,
        { provide: Logger, useValue: new Logger(LoggerLevel.DEBUG) },
        { provide: ISTORAGE, useClass: RamStorage, deps: [Logger, Platform] },
        Platform,
      ]
    });
  });

  describe('#profile', () => {
    let service: PersistenceProvider;
    beforeEach(inject([PersistenceProvider], (pp: PersistenceProvider) => {
      service = pp;
    }));
    it('should correctly perform a profile roundtrip', (done) => {
      let p = { name: 'My profile' };
      service.storeNewProfile(p)
        .catch((err) => expect(err).toBeNull)
        .then(() => {
          return service.getProfile();
        })
        .then((profile) => {
          expect(typeof profile).toEqual('object');
          expect(profile.name).toEqual('My profile');
        })
        .then(done);
    });

    it('should fail to create a profile when one already exists', () => {
      let p = { name: 'My profile' };
      service.storeNewProfile(p)
        .then(() => {
          return service.storeNewProfile(p);
        }).catch((err) => {
          expect(err.message).toEqual('Key already exists');
        });
    });
  });
});
