import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';

import { AppleWallet } from '@ionic-native/apple-wallet';

@Injectable()
export class AppleWalletProvider {
  constructor(private logger: Logger, private appleWallet: AppleWallet) {
    this.logger.debug('AppleWalletProvider initialized');
  }

  isAvailable(): Promise<any> {
    return this.appleWallet.available();
  }
}
