import { Injectable } from '@angular/core';
import { InjectionToken, Inject } from '@angular/core';
import { IStorage, ISTORAGE } from './istorage';

@Injectable()
export class StorageProvider {
  constructor( @Inject(ISTORAGE) private storage: IStorage) {
  }

  storeNewProfile(profile, cb) {
    this.storage.create('profile', profile, cb);
  };

  storeProfile(profile, cb) {
    this.storage.set('profile', profile, cb);
  };

  getProfile(cb) {
    this.storage.get('profile', cb);
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
