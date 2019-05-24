import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';

// providers
import { BwcProvider } from '../../providers/bwc/bwc';
import { ConfigProvider } from '../../providers/config/config';
import { PersistenceProvider } from '../persistence/persistence';

import * as _ from 'lodash';

@Injectable()
export class KeyProvider {
  constructor(
    private logger: Logger,
    private persistenceProvider: PersistenceProvider,
    private bwcProvider: BwcProvider
  ) {
    this.logger.debug('KeyProvider initialized');
  }

  // should add a key, after checking the key is not 
  // alteadyt present
  // key is a Key object from BWS
  //
  // Use Key.match(a,b) for comparison
  //
  public addKey(key): Promise<any> {
     //reject('Key already added');
  };

  // Use Key.match(a,b) for comparison
  // Should get a key, from its id.
  public getKey(keyId): <any> {
  };

}
