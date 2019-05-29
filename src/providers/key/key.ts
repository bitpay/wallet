import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';

// Providers
import { PersistenceProvider } from '../persistence/persistence';

@Injectable()
export class KeyProvider {
  private keys: any[];
  private isDirty: boolean;

  constructor(
    private logger: Logger,
    private persistenceProvider: PersistenceProvider
  ) {
    this.logger.debug('KeyProvider initialized');
    this.isDirty = false;
  }

  public load(): Promise<any> {
    return this.persistenceProvider.getKeys().then(keys => {
      keys = keys ? keys : [];
      this.keys = keys;
      return Promise.resolve();
    });
  }

  public storeKeysIfDirty(): Promise<any> {
    if (this.isDirty) {
      return this.persistenceProvider.setKeys(this.keys).then(() => {
        this.isDirty = false;
      });
    }
    this.logger.debug('The keys have not been saved. Not dirty');
    return Promise.resolve();
  }

  // should add a key, after checking the key is not
  // already present
  // key is a Key object from BWS
  //
  // Use Key.match(a,b) for comparison
  //
  public addKey(key): Promise<any> {
    let keyExists: boolean = false;
    this.keys.forEach(k => {
      if (key.match(key, k)) {
        keyExists = true;
      }
    });
    if (keyExists) {
      return Promise.reject('Key already added');
    } else {
      this.keys.push(key);
      this.isDirty = true;
      return this.storeKeysIfDirty();
    }
  }

  // should add multiple keys, after checking each key is not
  // already present
  // key is a Key object from BWS
  //
  // Use Key.match(a,b) for comparison
  //
  public addKeys(keysToAdd: any[]): Promise<any> {
    keysToAdd.forEach(keyToAdd => {
      if (!this.keys.find((k) => keyToAdd.match(keyToAdd, k))) {
        this.keys.push(keyToAdd);
        this.isDirty = true;
      } else {
        this.logger.warn('Key already added');
      }
    });
    return this.storeKeysIfDirty();
  }

  // Use Key.match(a,b) for comparison
  // Should get a key, from its id.
  public getKey(keyId: string): Promise<any> {
    this.logger.debug('Getting key: ' + keyId);

    let selectedKey = this.keys.find((k) => k.id == keyId);

    if (selectedKey) {
      return Promise.resolve(selectedKey);
    } else {
      this.logger.debug('No matches for key id: ' + keyId);
      return Promise.resolve(null);
    }
  }

  public removeKey(keyId: string): Promise<any> {
    this.logger.debug('Removing key: ' + keyId);
    let selectedKey: number;

    selectedKey = this.keys.findIndex(k => k.id == keyId);

    if (selectedKey >= 0) {
      this.keys.splice(selectedKey, 1);
      this.isDirty = true;
      return this.storeKeysIfDirty().then(() => {
        this.logger.debug('Key removed successfully');
        return Promise.resolve();
      });
    } else {
      const err = 'No matches for key id: ' + keyId;
      this.logger.debug(err);
      return Promise.reject(err);
    }
  }
}
