import { BwcProvider } from '../bwc/bwc';
import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';
import { PopupProvider } from '../popup/popup';

// Providers
import { PersistenceProvider } from '../persistence/persistence';

@Injectable()
export class KeyProvider {
  private keys: any[];
  private isDirty: boolean;
  private Key = this.bwcProvider.getKey();

  constructor(
    private logger: Logger,
    private bwcProvider: BwcProvider,
    private popupProvider: PopupProvider,
    private persistenceProvider: PersistenceProvider
  ) {
    this.logger.debug('KeyProvider initialized');
    this.isDirty = false;
  }

  public load(): Promise<any> {
    return this.persistenceProvider.getKeys().then(keys => {
      keys = keys ? keys : [];
      this.keys = keys.forEach(k => this.Key.fromObj(k));
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
      this.keys.push(this.Key.fromObj(key));
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
        this.keys.push(this.Key.fromObj(keyToAdd));
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

  // An alert dialog
  private askPassword(warnMsg: string, title: string): Promise<any> {
    return new Promise(resolve => {
      const opts = {
        type: 'password',
        useDanger: true
      };
      this.popupProvider.ionicPrompt(title, warnMsg, opts).then(res => {
        return resolve(res);
      });
    });
  }

  public encrypt(): Promise<any> {
    return new Promise((resolve, reject) => {
      let title = this.translate.instant('Enter a new encrypt password');
      const warnMsg = this.translate.instant(
        'Your wallet key will be encrypted. The encrypt password cannot be recovered. Be sure to write it down.'
      );
      this.askPassword(warnMsg, title)
        .then((password: string) => {
          if (_.isNull(password)) {
            return reject();
          }
          if (password == '') {
            return reject(this.translate.instant('No password'));
          }
          title = this.translate.instant('Confirm your new encrypt password');
          this.askPassword(warnMsg, title)
            .then((password2: string) => {
              if (_.isNull(password2)) {
                return reject();
              }
              if (password != password2)
                return reject(this.translate.instant('Password mismatch'));

              this.encryptPrivateKey(password);
              return resolve();
            })
            .catch(err => {
              return reject(err);
            });
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  public decrypt(walletsArray: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      this.askPassword(
        null,
        this.translate.instant('Enter encrypt password')
      ).then((password: string) => {
        if (_.isNull(password)) {
          return reject();
        }
        if (password == '') {
          return reject(this.translate.instant('No password'));
        }
        try {
          walletsArray.forEach(wallet => {
            this.logger.info(
              'Disabling private key encryption for' + wallet.name
            );
            wallet.decryptPrivateKey(password);
          });
        } catch (e) {
          return reject(this.translate.instant('Wrong password'));
        }
        return resolve();
      });
    });
  }

  public handleEncryptedWallet(wallet): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isEncrypted(wallet)) return resolve();
      this.askPassword(
        null,
        this.translate.instant('Enter encrypt password')
      ).then((password: string) => {
        if (_.isNull(password)) {
          return reject(new Error('PASSWORD_CANCELLED'));
        }
        if (password == '') {
          return reject(new Error('NO_PASSWORD'));
        }
        if (!wallet.checkPassword(password))
          return reject(new Error('WRONG_PASSWORD'));
        return resolve(password);
      });
    });
  }

  public reject(wallet, txp): Promise<any> {
    return new Promise((resolve, reject) => {
      this.rejectTx(wallet, txp)
        .then(txpr => {
          this.invalidateCache(wallet);
          this.events.publish('Local/TxAction', {
            walletId: wallet.id
          });
          return resolve(txpr);
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

}
