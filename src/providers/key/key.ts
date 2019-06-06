import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

// Providers
import { Logger } from '../../providers/logger/logger';
import { BwcProvider } from '../bwc/bwc';
import { PersistenceProvider } from '../persistence/persistence';
import { PopupProvider } from '../popup/popup';

import * as _ from 'lodash';
@Injectable()
export class KeyProvider {
  private isDirty: boolean;
  private Key = this.bwcProvider.getKey();
  private keys: any[];

  constructor(
    private logger: Logger,
    private bwcProvider: BwcProvider,
    private popupProvider: PopupProvider,
    private persistenceProvider: PersistenceProvider,
    private translate: TranslateService
  ) {
    this.logger.debug('KeyProvider initialized');
    this.isDirty = false;
  }

  public load(): Promise<any> {
    return this.persistenceProvider.getKeys().then(keys => {
      this.keys = [];
      keys = keys ? keys : [];
      keys.forEach(k => this.keys.push(this.Key.fromObj(k)));
      return Promise.resolve();
    });
  }

  public storeKeysIfDirty(): Promise<any> {
    if (this.isDirty) {
      const keysToAdd = [];
      this.keys.forEach(k => {
        keysToAdd.push(k.toObj(k));
      });
      return this.persistenceProvider.setKeys(keysToAdd).then(() => {
        this.isDirty = false;
        Promise.resolve();
      });
    } else {
      this.logger.debug('The keys have not been saved. Not dirty');
      return Promise.resolve();
    }
  }

  public addKey(keyToAdd): Promise<any> {
    const keyIndex = this.keys.findIndex(k => this.Key.match(keyToAdd, k));

    if (keyIndex >= 0) {
      this.keys.splice(keyIndex, 1, this.Key.fromObj(keyToAdd));
    } else {
      this.keys.push(this.Key.fromObj(keyToAdd));
    }
    this.isDirty = true;
    return this.storeKeysIfDirty();
  }

  public addKeys(keysToAdd: any[]): Promise<any> {
    keysToAdd.forEach(keyToAdd => {
      if (!this.keys.find(k => this.Key.match(keyToAdd, k))) {
        this.keys.push(this.Key.fromObj(keyToAdd));
        this.isDirty = true;
      } else {
        this.logger.warn('Key already added');
      }
    });
    return this.storeKeysIfDirty();
  }

  public getKey(keyId: string) {
    this.logger.debug('Getting key: ' + keyId);

    let selectedKey = this.keys.find(k => k.id == keyId);

    if (selectedKey) {
      return selectedKey;
    } else {
      this.logger.debug('No matches for key id: ' + keyId);
      return null;
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
    const opts = {
      type: 'password',
      useDanger: true
    };
    return this.popupProvider.ionicPrompt(title, warnMsg, opts);
  }

  public encrypt(keyId): Promise<any> {
    const key = this.getKey(keyId);
    let title = this.translate.instant('Enter a new encrypt password');
    const warnMsg = this.translate.instant(
      'Your wallet key will be encrypted. The encrypt password cannot be recovered. Be sure to write it down.'
    );
    return this.askPassword(warnMsg, title).then((password: string) => {
      if (password == '' || _.isNull(password)) {
        return Promise.reject(this.translate.instant('No password'));
      }
      title = this.translate.instant('Confirm your new encrypt password');
      return this.askPassword(warnMsg, title).then((password2: string) => {
        if (password != password2 || _.isNull(password2))
          return Promise.reject(this.translate.instant('Password mismatch'));

        this.encryptPrivateKey(key, password);
        return Promise.resolve();
      });
    });
  }

  public encryptNewKey(key): Promise<any> {
    let title = this.translate.instant(
      'Enter a password to encrypt your wallet'
    );
    const warnMsg = this.translate.instant(
      'This password is only for this device, and it cannot be recovered. To avoid losing funds, write your password down.'
    );
    return this.askPassword(warnMsg, title).then((password: string) => {
      if (!password) {
        return this.showWarningNoEncrypt().then(res => {
          if (res) return Promise.resolve();
          return this.encryptNewKey(key);
        });
      } else {
        title = this.translate.instant(
          'Enter your encrypt password again to confirm'
        );
        return this.askPassword(warnMsg, title).then((password2: string) => {
          if (!password2 || password != password2) {
            return this.encryptNewKey(key);
          } else {
            this.encryptPrivateKey(key, password);
            return Promise.resolve();
          }
        });
      }
    });
  }

  public showWarningNoEncrypt(): Promise<any> {
    const title = this.translate.instant('Are you sure?');
    const msg = this.translate.instant(
      'Without encryption, a thief or another application on this device may be able to access your funds.'
    );
    const okText = this.translate.instant("I'm sure");
    const cancelText = this.translate.instant('Go Back');
    return this.popupProvider.ionicConfirm(title, msg, okText, cancelText);
  }

  public decrypt(keyId: string): Promise<any> {
    const key = this.getKey(keyId);
    return this.askPassword(
      null,
      this.translate.instant('Enter encrypt password')
    ).then((password: string) => {
      if (password == '' || _.isNull(password)) {
        return Promise.reject(this.translate.instant('No password'));
      }
      try {
        this.decryptPrivateKey(key, password);
      } catch (e) {
        return Promise.reject(this.translate.instant('Wrong password'));
      }
      return Promise.resolve();
    });
  }

  public handleEncryptedWallet(keyId: string): Promise<any> {
    const key = this.getKey(keyId);
    const isPrivKeyEncrypted = this.isPrivKeyEncrypted(keyId);

    if (!isPrivKeyEncrypted) return Promise.resolve();
    return this.askPassword(
      null,
      this.translate.instant('Enter encrypt password')
    ).then((password: string) => {
      if (_.isNull(password)) {
        return Promise.reject(new Error('PASSWORD_CANCELLED'));
      }
      if (password == '') {
        return Promise.reject(new Error('NO_PASSWORD'));
      }
      if (!key.checkPassword(password))
        return Promise.reject(new Error('WRONG_PASSWORD'));
      return Promise.resolve(password);
    });
  }

  public isPrivKeyEncrypted(keyId: string) {
    const key = this.getKey(keyId);
    return key.isPrivKeyEncrypted();
  }

  public isDeletedSeed(keyId: string): boolean {
    const key = this.getKey(keyId);
    return !key.mnemonic && !key.mnemonicEncrypted;
  }

  public mnemonicHasPassphrase(keyId: string): boolean {
    const key = this.getKey(keyId);
    return key.mnemonicHasPassphrase;
  }

  public get(keyId: string, password: string) {
    const key = this.getKey(keyId);
    return key.get(password);
  }

  public getBaseAddressDerivationPath(keyId, opts): string {
    const key = this.getKey(keyId);
    return key.getBaseAddressDerivationPath(opts);
  }

  public encryptPrivateKey(key, password: string) {
    key.encrypt(password);
  }

  public decryptPrivateKey(key, password: string) {
    key.decrypt(password);
  }

  public sign(
    keyId: string,
    rootPath: string,
    txp,
    password: string
  ): Promise<any> {
    const key = this.getKey(keyId);

    return key.sign(rootPath, txp, password);
  }
}
