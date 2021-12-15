import { Injectable } from '@angular/core';

// providers
import { PersistenceProvider } from '../persistence/persistence';

import * as bitauthService from 'bitauth';
import * as _ from 'lodash';
import { Logger } from '../logger/logger';

@Injectable({
  providedIn: 'root'
})
export class AppIdentityProvider {
  constructor(
    private logger: Logger,
    private persistenceProvider: PersistenceProvider
  ) {
    this.logger.debug('AppIdentityProvider initialized');
  }

  public getIdentity(network, cb) {
    let pubkey;
    let isNew;
    this.persistenceProvider.getAppIdentity(network).then(data => {
      let appIdentity = data || {};

      if (_.isEmpty(appIdentity) || (appIdentity && !appIdentity.priv)) {
        isNew = true;
        appIdentity = bitauthService.generateSin();
      }
      try {
        pubkey = bitauthService.getPublicKeyFromPrivateKey(appIdentity.priv);
        bitauthService.getSinFromPublicKey(pubkey);
        if (isNew)
          this.persistenceProvider.setAppIdentity(network, appIdentity);
      } catch (e) {
        return cb(e);
      }
      return cb(null, appIdentity);
    });
  }
}
