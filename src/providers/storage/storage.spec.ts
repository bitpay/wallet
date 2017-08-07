import { TestBed, inject } from '@angular/core/testing';
import { StorageProvider } from './storage';
import { LocalStorage, KeyAlreadyExistsError } from './local-storage';
import { IStorage, ISTORAGE } from './istorage';

class StorageMock implements IStorage {
  hash = {};

  get(k: string, cb: (err: Error, v: string) => void) {
    return cb(null, this.hash[k]);
  };
  set(k: string, v: any, cb: (err: Error) => void) {
    this.hash[k] = v.toString();
    return cb(null);
  };
  remove(k: string, cb: (err: Error) => void) {
    delete this.hash[k];
    return cb(null);
  };
  create(k: string, v: any, cb: (err: Error) => void) {
    this.get(k,
      function (err, data) {
        if (data) {
          return cb(new KeyAlreadyExistsError());
        } else {
          this.set(k, v, cb);
        }
      })
  };
}

describe('Storage Service', () => {
  let storage: IStorage = new StorageMock();
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        StorageProvider,
        { provide: ISTORAGE, useValue: storage },
      ]
    });
  });

  it('should do nothing', inject([StorageProvider], (service: StorageProvider) => {
    storage.set('profile', { name: 'john doe' }, (err) => {
      service.getProfile((err, profile) => {
        expect(err).toBeNull;
        console.log(JSON.stringify(profile));
        expect(profile.name).toEqual('john doe');
      });
    });
  }));
});