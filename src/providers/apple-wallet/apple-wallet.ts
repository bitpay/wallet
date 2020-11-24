import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';

import {
  AppleWallet,
  CardData,
} from '@ionic-native/apple-wallet';

@Injectable()
export class AppleWalletProvider {
  constructor(private logger: Logger, private appleWallet: AppleWallet) {
    this.logger.debug('AppleWalletProvider initialized');
  }

  isAvailable(): Promise<any> {
    return this.appleWallet.available();
  }

  startAddPaymentPass(params: CardData): Promise<any> {
    return this.appleWallet.startAddPaymentPass(params);
  }

  completeAddPaymentPass(params: any): Promise<any> {
    return this.appleWallet.completeAddPaymentPass(params);
  }
}
