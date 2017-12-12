import { Injectable } from '@angular/core';
import { PlatformProvider } from '../platform/platform';
import { ConfigProvider } from '../config/config';
import { Logger } from '@nsalaun/ng-logger';

import { TouchID } from '@ionic-native/touch-id';
import { AndroidFingerprintAuth } from '@ionic-native/android-fingerprint-auth';

@Injectable()
export class TouchIdProvider {

  private _isAvailable: boolean = false;

  constructor(
    private touchId: TouchID,
    private androidFingerprintAuth: AndroidFingerprintAuth,
    private platform: PlatformProvider,
    private config: ConfigProvider,
    private logger: Logger
  ) { }

  public init(): void {
    if (this.platform.isCordova) {
      if (this.platform.isAndroid) this.checkAndroid();
      if (this.platform.isIOS) this.checkIOS();
    }
  }

  private checkIOS(): void {
    this.touchId.isAvailable()
      .then(
      res => this._isAvailable = true,
      err => this.logger.debug("Fingerprint is not available")
      );
  }

  private checkAndroid(): void {
    this.androidFingerprintAuth.isAvailable()
      .then(
      res => {
        if (res.isAvailable) this._isAvailable = true
        else this.logger.debug("Fingerprint is not available")
      });
  }

  private verifyIOSFingerprint(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.touchId.verifyFingerprint('Scan your fingerprint please')
        .then(
        res => resolve(),
        err => reject()
        );
    });
  }

  private verifyAndroidFingerprint(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.androidFingerprintAuth.encrypt({ clientId: 'Copay' })
        .then(result => {
          if (result.withFingerprint) {
            this.logger.debug('Successfully authenticated with fingerprint.');
            resolve();
          } else if (result.withBackup) {
            this.logger.debug('Successfully authenticated with backup password!');
            resolve();
          } else this.logger.debug('Didn\'t authenticate!');
        }).catch(error => {
          if (error === this.androidFingerprintAuth.ERRORS.FINGERPRINT_CANCELLED) {
            this.logger.debug('Fingerprint authentication cancelled');
            reject();
          } else {
            this.logger.warn(error);
            resolve();
          };
        });
    });
  }

  public isAvailable(): boolean {
    return this._isAvailable;
  }

  public check(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isAvailable()) reject();
      if (this.platform.isIOS) {
        this.verifyIOSFingerprint()
          .then(() => {
            resolve();
          })
          .catch(() => {
            reject();
          });
      };
      if (this.platform.isAndroid) {
        this.verifyAndroidFingerprint()
          .then(() => {
            resolve();
          })
          .catch(() => {
            reject();
          });
      };
    });
  }

  private isNeeded(wallet: any): string {
    let config: any = this.config.get();
    config.touchIdFor = config.touchIdFor || {};
    return config.touchIdFor[wallet.credentials.walletId];
  }

  public checkWallet(wallet: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isAvailable()) return resolve();
      if (this.isNeeded(wallet)) {
        this.check().then(() => {
          return resolve();
        }).catch(() => {
          return reject();
        });
      };
    });
  }
}
