import { TestBed, inject } from '@angular/core/testing';
import { PersistenceProvider } from './persistence';
import { IStorage, ISTORAGE, KeyAlreadyExistsError } from './storage/istorage';
import { RamStorage } from './storage/ram-storage';

describe('Storage Service', () => {
  let storage: IStorage = new RamStorage();
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PersistenceProvider,
        { provide: ISTORAGE, useValue: storage },
      ]
    });
  });

  describe('#profile', () => {
    it('should correctly perform a profile roundtrip', inject([PersistenceProvider], (service: PersistenceProvider) => {
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
    it('should fail to create a profile when one already exists', inject([PersistenceProvider], (service: PersistenceProvider) => {
      var p = { name: 'My profile' };
      service.storeNewProfile(p, (err) => {
        expect(err).toBeNull;
        service.storeNewProfile(p, (err) => {
          expect(err.message).toEqual('Key already exists');
        });
      });
    }));
  });
});