import { Injectable } from '@angular/core';
import { AndroidFingerprintAuth } from '@ionic-native/android-fingerprint-auth';
import { TouchID } from '@ionic-native/touch-id';

// Providers
import { AppProvider } from '../../providers/app/app';
import { Logger } from '../../providers/logger/logger';
import { ConfigProvider } from '../config/config';
import { PlatformProvider } from '../platform/platform';

export enum TouchIdErrors {
  fingerprintCancelled = 'FINGERPRINT_CANCELLED'
}
@Injectable()
export class TouchIdProvider {
  public iosBiometricMethod: string;

  constructor(
    private app: AppProvider,
    private touchId: TouchID,
    private androidFingerprintAuth: AndroidFingerprintAuth,
    private platform: PlatformProvider,
    private config: ConfigProvider,
    private logger: Logger
  ) {}

  public isAvailable(): Promise<any> {
    return new Promise(resolve => {
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
    return new Promise(resolve => {
      this.touchId.isAvailable().then(
        type => {
          this.iosBiometricMethod = type;
          return resolve(true);
        },
        () => {
          this.logger.warn('(iOS) Biometric ID is not available');
          return resolve(false);
        }
      );
    });
  }

  public getIosBiometricMethod(): string {
    return this.iosBiometricMethod;
  }

  private checkAndroid() {
    return new Promise(resolve => {
      this.androidFingerprintAuth
        .isAvailable()
        .then(res => {
          if (res.isAvailable) return resolve(true);
          else {
            this.logger.warn('Biometric ID is not available');
            return resolve(false);
          }
        })
        .catch(() => {
          this.logger.warn(
            '(Android) Biometric ID is not available for this device'
          );
          return resolve(false);
        });
    });
  }

  private verifyIOSFingerprint(): Promise<any> {
    return this.touchId
      .verifyFingerprint('Request Biometric Authentication')
      .then(() => {
        this.logger.debug('Successfully authenticated');
      })
      .catch(err => {
        if (err && (err.code == -2 || err.code == -128))
          err.message = TouchIdErrors.fingerprintCancelled;
        throw err;
      });
  }

  private verifyAndroidFingerprint(): Promise<any> {
    return this.androidFingerprintAuth
      .encrypt({ clientId: this.app.info.nameCase })
      .then(result => {
        if (result.withFingerprint) {
          this.logger.debug('Successfully authenticated');
        } else if (result.withBackup) {
          this.logger.debug('Successfully authenticated with backup password!');
        } else this.logger.warn("Didn't authenticate!");
      })
      .catch(error => {
        const err = new Error(error);
        if (error === TouchIdErrors.fingerprintCancelled) {
          this.logger.debug('(Android) Biometric ID authentication cancelled');
          err.message = TouchIdErrors.fingerprintCancelled;
        } else {
          this.logger.warn('Could not get Biometric ID Authenticated', error);
        }
        throw err;
      });
  }

  public check(): Promise<any> {
    if (this.platform.isIOS) return this.verifyIOSFingerprint();
    if (this.platform.isAndroid) return this.verifyAndroidFingerprint();
    return undefined;
  }

  private isNeeded(wallet): string {
    let config = this.config.get();
    config.touchIdFor = config.touchIdFor || {};
    return config.touchIdFor[wallet.credentials.walletId];
  }

  public checkWallet(wallet): Promise<any> {
    return this.isAvailable().then((isAvailable: boolean) => {
      if (!isAvailable) return undefined;
      if (this.isNeeded(wallet)) return this.check();
      return undefined;
    });
  }
}
