import { Injectable } from '@angular/core';
import BWC from 'bitcore-wallet-client';
import { Platform } from 'ionic-angular';
import { Logger } from '../logger/logger';
import { FileStorage } from '../persistence/storage/file-storage';
import { LocalStorage } from '../persistence/storage/local-storage';

// https://medium.com/javascript-in-plain-english/private-member-in-javascript-class-2359ef666aaf
const privateProps = new WeakMap();
@Injectable()
export class KeyEncryptProvider {
  public keyEncryptionErr: Error;

  constructor(
    private logger: Logger,
    private platform: Platform,
    private fileStorage: FileStorage,
    private localStorage: LocalStorage
  ) {
    logger.info(`KeyEncryptProvider Constructor ${new Date().toString()}`);
    // new key at the end
    privateProps.set(this, {
      STORAGE_ENCRYPTING_KEYS: []
    });
  }

  public init() {
    return new Promise<void>(resolve => {
      this.logger.debug('Running key encrypt provider init function');
      setTimeout(async () => {
        if (privateProps.get(this).STORAGE_ENCRYPTING_KEYS.length === 0) {
          this.logger.debug('KeyEncryptProvider - no encrypting keys');
          return resolve();
        }
        const storage = this.platform.is('cordova')
          ? this.fileStorage
          : this.localStorage;

        let keys = await storage.get('keys'); // get key

        if (!keys) {
          this.logger.debug('KeyEncryptProvider - no keys');
          return resolve();
        }

        let decryptedKeys;
        try {
          decryptedKeys = this.tryDescryptKeys(JSON.stringify(keys));
        } catch (err) {
          this.keyEncryptionErr = err;
          return resolve();
        }

        const storageEncryptingKey = privateProps.get(this)
          .STORAGE_ENCRYPTING_KEYS[
          privateProps.get(this).STORAGE_ENCRYPTING_KEYS.length - 1
        ]; // new encrypt key
        const encryptedKeys = BWC.sjcl.encrypt(
          storageEncryptingKey,
          decryptedKeys
        );
        this.logger.debug(
          `Storage encrypted with key number: ${
            privateProps.get(this).STORAGE_ENCRYPTING_KEYS.length
          }`
        );
        await storage.set('keys', JSON.parse(encryptedKeys));
        return resolve();
      }, 500);
    });
  }

  private tryDescryptKeys(keys: string) {
    let decryptedKeys;
    privateProps.get(this).STORAGE_ENCRYPTING_KEYS.every((value, index) => {
      try {
        const storageEncryptingKeyHash = BWC.Bitcore.crypto.Hash.sha256(
          Buffer.from(value)
        ).toString('hex');
        this.logger.debug(
          `Trying to decrypt with: ${storageEncryptingKeyHash}`
        );
        decryptedKeys = BWC.sjcl.decrypt(value, keys);
        this.logger.debug(`Storage decrypted with key number: ${index + 1}`);
        return false; // break;
      } catch (err) {
        if (
          privateProps.get(this).STORAGE_ENCRYPTING_KEYS.length - 1 ===
          index
        ) {
          // Failed on the last iteration
          this.logger.debug(
            `Could not decrypt storage. Tested ${
              privateProps.get(this).STORAGE_ENCRYPTING_KEYS.length
            } keys without success`
          );
          if (err && err.message == "ccm: tag doesn't match") {
            this.logger.error(err.message);
            throw new Error(
              'This version is not compatible with your storage, please update to the most recent version or contact support and share the logs provided.'
            );
          } else if (err && err.message == "json decode: this isn't json!") {
            this.logger.debug('Not yet encrypted?');
            // TODO ??
            // this.logger.error(err.message);
            // throw new Error(
            //   'Your wallet is in a corrupt state. Please contact support and share the logs provided.'
            // );
          }
        }
        return true; // continue;
      }
    });
    return decryptedKeys || keys;
  }

  public encryptKeys(keys): string {
    if (privateProps.get(this).STORAGE_ENCRYPTING_KEYS.length === 0) {
      this.logger.debug('encryptKeys - no encrypting keys');
      return JSON.stringify(keys);
    }
    const encryptingKey = privateProps.get(this).STORAGE_ENCRYPTING_KEYS[
      privateProps.get(this).STORAGE_ENCRYPTING_KEYS.length - 1
    ];
    let encryptedKeys;
    try {
      encryptedKeys = BWC.sjcl.encrypt(encryptingKey, JSON.stringify(keys));
    } catch (error) {
      // something ? TODO
    }
    this.logger.debug(
      `Storage encrypted successfully with key number: ${
        privateProps.get(this).STORAGE_ENCRYPTING_KEYS.length
      }`
    );
    return encryptedKeys;
  }

  public decryptKeys(encryptedKeys): string {
    if (privateProps.get(this).STORAGE_ENCRYPTING_KEYS.length === 0) {
      this.logger.debug('decryptKeys - no encrypting keys');
      return JSON.stringify(encryptedKeys);
    }
    const encryptingKey = privateProps.get(this).STORAGE_ENCRYPTING_KEYS[
      privateProps.get(this).STORAGE_ENCRYPTING_KEYS.length - 1
    ];
    let keys;
    try {
      keys = BWC.sjcl.decrypt(encryptingKey, JSON.stringify(encryptedKeys));
    } catch (error) {
      // something ? TODO
    }
    this.logger.debug(
      `Storage decrypted successfully with key number: ${
        privateProps.get(this).STORAGE_ENCRYPTING_KEYS.length
      }`
    );
    return keys;
  }
}
