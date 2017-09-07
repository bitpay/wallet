import { Injectable } from '@angular/core';
import * as moment from 'moment';
import * as _ from 'lodash';
import { PersistenceProvider } from '../persistence/persistence';
import { ConfigProvider } from '../config/config';
import { BwcProvider } from '../bwc/bwc';

interface Profile {
  version: string;
  createdOn: Number;
  credentials: Array<any>;
  disclaimerAccepted: boolean;
  checked: Object;
  checkedUA?: Object;
}

class Profile implements Profile {
  constructor(
    public version: string = '1.0.0',
    public createdOn: Number = moment( new Date() ).valueOf(),
    public credentials: Array<any> = new Array(),
    public disclaimerAccepted: boolean = false,
    public checked: Object = new Object()
  ) {
    // Nothing to do
  }

}

@Injectable()
export class ProfileProvider {
  public profile: Profile;

  constructor(
    private persistence: PersistenceProvider,
    private config: ConfigProvider,
    private bwc: BwcProvider
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

  create() {
    this.profile = new Profile();

    console.log('[profile.ts:33]', this.profile); //TODO

    this.persistence.storeNewProfile(this.profile).then(() => {
      // bindProfile (this.profile)
    }, (error) => {
      // Todo: error?
    });
  }

  bind(profile: Profile) {
    let l = profile.credentials.length;
    let i = 0;
    let totalBound = 0;

    if (!l) return;

    _.each(profile.credentials, function(credentials) {
      this.bindWallet(credentials, function(err, bound) {
        i++;
        totalBound += bound;
        if (i == l) {
          console.log('Bound ' + totalBound + ' out of ' + l + ' wallets');
          return;
        }
      });
    });
  }

  bindWallet(credentials) {
    let defaults = this.config.get();

    /*
    let client = this.bwc.getClient(JSON.stringify(credentials), {
      bwsurl: defaults['bws']['url'],
    });
     */
  }

}
