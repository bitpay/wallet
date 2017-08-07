import { Injectable } from '@angular/core';
import { InjectionToken, Inject } from '@angular/core';
import { IStorage, ISTORAGE } from './storage/istorage';

@Injectable()
export class PersistenceProvider {
  constructor( @Inject(ISTORAGE) public storage: IStorage) {
  }

  storeNewProfile(profile): Promise<void> {
    return this.storage.create('profile', profile);
  };

  storeProfile(profile): Promise<void> {
    return this.storage.set('profile', profile);
  };

  getProfile(): Promise<any> {
    return this.storage.get('profile').then((profile) => {
      return profile;
    });
    // decryptOnMobile(str, function (err, str) {
    //   if (err) return cb(err);
    //   var p, err;
    //   try {
    //     p = Profile.fromString(str);
    //   } catch (e) {
    //     $log.debug('Could not read profile:', e);
    //     err = new Error('Could not read profile:' + p);
    //   }
    //   return cb(err, p);
    // });
  };
}
