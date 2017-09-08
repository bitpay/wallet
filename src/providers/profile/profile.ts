import { Injectable } from '@angular/core';
import { Events } from 'ionic-angular';
import * as moment from 'moment';
import * as _ from 'lodash';
import { PersistenceProvider } from '../persistence/persistence';
import { ConfigProvider } from '../config/config';
import { BwcProvider } from '../bwc/bwc';
import { WalletProvider } from '../wallet/wallet';

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
    public events: Events,
    private wallet: WalletProvider,
    private persistence: PersistenceProvider,
    private config: ConfigProvider,
    private bwc: BwcProvider
  ) {
    console.log('Hello ProfileProvider Provider');
  }

  get() {
    return new Promise((resolve, reject) => {
      this.persistence.getProfile().then((profile: any) => {
        this.profile = profile;
        resolve(profile);
      }, (error) => {
        reject(error);
      });
    });
  };

  create() {
    this.profile = new Profile();

    this.persistence.storeNewProfile(this.profile).then(() => {
      // TODO: bind?
    }, (error) => {
      // TODO: error?
    });
  }

  bind() {
    let l = this.profile.credentials.length;
    let wallets = new Array();

    if (!l) return wallets;
    let credentials = this.profile.credentials;

    _.each(credentials, (credential) => {
      wallets.push(this.wallet.bind(credential));
    });
    return wallets;
  }

}
