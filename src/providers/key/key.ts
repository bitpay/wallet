import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';

// Providers
import { PersistenceProvider } from '../persistence/persistence';

@Injectable()
export class KeyProvider {
  constructor(
    private logger: Logger,
    private persistenceProvider: PersistenceProvider
  ) {
    this.logger.debug('KeyProvider initialized');
  }

  // should add a key, after checking the key is not 
  // already present
  // key is a Key object from BWS
  //
  // Use Key.match(a,b) for comparison
  //
  public addKey(key): Promise<any> {
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

  // should add multiple keys, after checking each key is not 
  // already present
  // key is a Key object from BWS
  //
  // Use Key.match(a,b) for comparison
  //
  public addKeys(keysToAdd: any[]): Promise<any> {
    return this.persistenceProvider.getKeys().then((keys: any[]) => {
      keys = keys ? keys : [];
      keys.forEach(k => {
        keysToAdd.forEach((keyToAdd) => {
          if (keyToAdd.match(keyToAdd, k)) {
            this.logger.warn('Key already added');
          } else {
            keys.push(keyToAdd);
          }
        });
      });
      this.persistenceProvider.setKeys(keys);
      return Promise.resolve();
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
