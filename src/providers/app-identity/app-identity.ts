import { Injectable } from '@angular/core';
import { Logger } from '@nsalaun/ng-logger';

//providers
import { PersistenceProvider } from '../persistence/persistence';

import * as _ from 'lodash';

@Injectable()
export class AppIdentityProvider {

  constructor(
    private logger: Logger,
    private persistenceProvider: PersistenceProvider,
  ) {
    this.logger.info('AppIdentityProvider initialized.');
  }

  public getIdentity(network, cb) {
    //var pubkey;
    //var sin;
    var isNew;
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
