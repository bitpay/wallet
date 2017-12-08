import { Injectable } from '@angular/core';
import { Logger } from '@nsalaun/ng-logger';

//providers
import { PersistenceProvider } from '../persistence/persistence';

import * as _ from 'lodash'; 

@Injectable()
export class AppProvider {

  constructor(
    private logger: Logger,
    private persistenceProvider: PersistenceProvider,
  ) {
    this.logger.info('AppProvider initialized.');
  }

  public getIdentity(network, cb) {
    var pubkey, sin, isNew;
    this.persistenceProvider.getAppIdentity(network).then((data) => {
      var appIdentity = data || {};
      if (_.isEmpty(appIdentity) || (appIdentity && !appIdentity.priv)) {
        isNew = true;
        //appIdentity = this.bitauthProvider.generateSin(); TODO
      }
      try {
        //pubkey = this.bitauthProvider.getPublicKeyFromPrivateKey(appIdentity.priv); TODO
       // sin = this.bitauthProvider.getSinFromPublicKey(pubkey); TODO
        if (isNew)
        this.persistenceProvider.setAppIdentity(network, JSON.stringify(appIdentity));
      }
      catch (e) {
        this.logger.error(e);
        return cb(e);
      };
      return cb(null, appIdentity);
    }).catch((err) => {
    return cb(err);
     });
  };
}
