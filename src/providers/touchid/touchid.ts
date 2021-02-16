import { Injectable } from '@angular/core';
import { FingerprintAIO } from '@ionic-native/fingerprint-aio';

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
    private platform: PlatformProvider,
    private config: ConfigProvider,
    private logger: Logger,
    private faio: FingerprintAIO
  ) {}

  public isAvailable(): Promise<any> {
    if (!this.platform.isCordova) return Promise.resolve(false);
    return this.faio
      .isAvailable()
      .then(val => {
        this.logger.debug('Biometric: ', val);
        this.iosBiometricMethod = val;
        return Promise.resolve(true);
      })
      .catch(e => {
        this.logger.error('Biometric: ' + e.message, e.code);
        return Promise.resolve(false);
      });
  }

  public check(): Promise<any> {
    if (!this.platform.isCordova) return undefined;
    if (this.platform.isAndroid) this.app.skipLockModal = true;
    return this.faio
      .show({
        clientId: this.app.info.name
      })
      .then((result: any) => {
        this.logger.debug('Biometric: ', result);
      })
      .catch((e: any) => {
        this.logger.error('Biometric: ' + e.message, e.code);
        throw e;
      });
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

  public getIosBiometricMethod(): string {
    return this.iosBiometricMethod;
  }
}
