import { TestBed, inject } from '@angular/core/testing';
import { StorageProvider } from './storage';
import { LocalStorage } from './local-storage';
import { IStorage, ISTORAGE } from './istorage';
import * as Mocks from '../../mocks';

describe('Storage Service', () => {
  let storage: IStorage = new Mocks.StorageMock();
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        StorageProvider,
        { provide: ISTORAGE, useValue: storage },
      ]
    });
  });

  describe('#profile', () => {
    it('should correctly perform a profile roundtrip', inject([StorageProvider], (service: StorageProvider) => {
      var p = { name: 'My profile' };
      service.storeNewProfile(p, (err) => {
        expect(err).toBeNull;
        service.getProfile((err, profile) => {
          expect(err).toBeNull;
          expect(typeof profile).toEqual('object');
          expect(profile.name).toEqual('My profile');
        });
      });
    }));
  });
});