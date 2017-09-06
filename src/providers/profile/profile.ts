import { Injectable } from '@angular/core';
import { PersistenceProvider } from '../persistence/persistence';

@Injectable()
export class ProfileProvider {

  constructor(
    private persistence: PersistenceProvider
  ) {
    console.log('Hello ProfileProvider Provider');
  }

  get() {
    return new Promise((resolve, reject) => {
      this.persistence.getProfile().then((profile: any) => {
        resolve(profile);
      }, (error) => {
        reject(error);
      });
    });
  };

}
