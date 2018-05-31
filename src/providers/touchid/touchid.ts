import { Injectable } from '@angular/core';
import { AndroidFingerprintAuth } from '@ionic-native/android-fingerprint-auth';
import { TouchID } from '@ionic-native/touch-id';

// Providers
import { AppProvider } from '../../providers/app/app';
import { Logger } from '../../providers/logger/logger';
import { ConfigProvider } from '../config/config';
import { PlatformProvider } from '../platform/platform';

@Injectable()
export class TouchIdProvider {
  constructor(
    private app: AppProvider,
    private touchId: TouchID,
    private androidFingerprintAuth: AndroidFingerprintAuth,
    private platform: PlatformProvider,
    private config: ConfigProvider,
    private logger: Logger
  ) {}

  public isAvailable(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.platform.isCordova && this.platform.isAndroid) {
        this.checkAndroid().then(isAvailable => {
          return resolve(isAvailable);
        });
      } else if (this.platform.isCordova && this.platform.isIOS) {
        this.checkIOS().then(isAvailable => {
          return resolve(isAvailable);
        });
      } else {
        return resolve(false);
      }
    });
  }

  private checkIOS(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.touchId.isAvailable().then(
        res => {
          return resolve(true);
        },
        err => {
          this.logger.debug('Fingerprint is not available');
          return resolve(false);
        }
      );
    });
  }

  private checkAndroid() {
    return new Promise((resolve, reject) => {
      this.androidFingerprintAuth
        .isAvailable()
        .then(res => {
          if (res.isAvailable) return resolve(true);
          else {
            this.logger.debug('Fingerprint is not available');
            return resolve(false);
          }
        })
        .catch(err => {
          this.logger.warn(
            'Touch ID (Android) is not available for this device'
          );
          return resolve(false);
        });
    });
  }

  private verifyIOSFingerprint(): Promise<any> {
    return this.touchId
      .verifyFingerprint('Scan your fingerprint please')
      .catch(err => {
        if (err && (err.code == -2 || err.code == -128))
          err.fingerprintCancelled = true;
        throw err;
      });
  }

  private verifyAndroidFingerprint(): Promise<any> {
    return this.androidFingerprintAuth
      .encrypt({ clientId: this.app.info.nameCase })
      .then(result => {
        if (result.withFingerprint) {
          this.logger.debug('Successfully authenticated with fingerprint.');
        } else if (result.withBackup) {
          this.logger.debug('Successfully authenticated with backup password!');
        } else this.logger.debug("Didn't authenticate!");
      })
      .catch(error => {
        const err: any = new Error(error);
        if (error === 'FINGERPRINT_CANCELLED') {
          this.logger.debug('Fingerprint authentication cancelled');
          err.fingerprintCancelled = true;
        } else {
          this.logger.warn('Could not get Fingerprint Authenticated', error);
        }
        throw err;
      });
  }

  public check(): Promise<any> {
    if (this.platform.isIOS) return this.verifyIOSFingerprint();

    if (this.platform.isAndroid) return this.verifyAndroidFingerprint();
  }

  private isNeeded(wallet: any): string {
    let config: any = this.config.get();
    config.touchIdFor = config.touchIdFor || {};
    return config.touchIdFor[wallet.credentials.walletId];
  }

  public checkWallet(wallet: any): Promise<any> {
    return this.isAvailable().then((isAvailable: boolean) => {
      if (!isAvailable) return;

      if (this.isNeeded(wallet)) return this.check();
    });
  }
}
