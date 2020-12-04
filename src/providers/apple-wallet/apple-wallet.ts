import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';

import { AppleWallet, CardData } from 'apple-wallet-ng';

@Injectable()
export class AppleWalletProvider {
  constructor(private logger: Logger, private appleWallet: AppleWallet) {
    this.logger.debug('AppleWalletProvider initialized');
  }

  available(): Promise<any> {
    return this.appleWallet.available();
  }

  startAddPaymentPass(params: CardData): Promise<any> {
    return this.appleWallet.startAddPaymentPass(params);
  }

  completeAddPaymentPass(params: any): Promise<any> {
    return this.appleWallet.completeAddPaymentPass(params);
  }

  checkPairedDevicesBySuffix(cardSuffix: string): Promise<any> {
    return this.appleWallet.checkPairedDevicesBySuffix(cardSuffix);
  }
}
