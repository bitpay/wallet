import { TestBed, inject } from '@angular/core/testing';
import { PersistenceProvider } from './persistence';
import { IStorage, ISTORAGE, KeyAlreadyExistsError } from './storage/istorage';
import { RamStorage } from './storage/ram-storage';

describe('Storage Service', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PersistenceProvider,
        { provide: ISTORAGE, useClass: RamStorage },
      ]
    });
  });

  describe('#profile', () => {
    let service: PersistenceProvider;
    beforeEach(inject([PersistenceProvider], (pp: PersistenceProvider) => {
      service = pp;
    }));
    it('should correctly perform a profile roundtrip', () => {
      var p = { name: 'My profile' };
      service.storeNewProfile(p).then(() => {
        service.getProfile().then((profile) => {
          expect(typeof profile).toEqual('object');
          expect(profile.name).toEqual('My profile');
        });
      });
    });
    it('should fail to create a profile when one already exists', () => {
      var p = { name: 'My profile' };
      service.storeNewProfile(p).then(() => {
        service.storeNewProfile(p).catch((err) => {
          expect(err.message).toEqual('Key already exists');
        });
      });
    });
  });
});