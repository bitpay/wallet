import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';

// providers
// import { BwcProvider } from '../../providers/bwc/bwc';
// import { ConfigProvider } from '../../providers/config/config';
import { PersistenceProvider } from '../persistence/persistence';

// import * as _ from 'lodash';

@Injectable()
export class KeyProvider {
  constructor(
    private logger: Logger,
    private persistenceProvider: PersistenceProvider,
    // private bwcProvider: BwcProvider
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
    key.match = (a, b) => {
      return (a.id == b.id);
    }
    return this.persistenceProvider.getKeys().then((keys: any[]) => {
      keys = keys ? keys : [];
      let keyExists: boolean = false;
      keys.forEach(k => {
        if (key.match(key, k)) {
          keyExists = true;
        }
      });
      if (keyExists) {
        return Promise.reject('Key already added');
      } else {
        keys.push(key);
        this.persistenceProvider.setKeys(keys);
        return Promise.resolve();
      }
    });
  }

  // Use Key.match(a,b) for comparison
  // Should get a key, from its id.
  public getKey(keyId: string): Promise<any> {
    this.logger.debug('Getting key: ' + keyId);
    return this.persistenceProvider.getKeys().then((keys: any[]) => {
      let selectedKey;
      keys.forEach(key => {
        if (key.id == keyId) {
          selectedKey = key;
        }
      });
      if (selectedKey) {
        return Promise.resolve(selectedKey);
      } else {
        this.logger.debug('No matches for key id: ' + keyId);
        return Promise.resolve(null);
      }
    })
  }

}
