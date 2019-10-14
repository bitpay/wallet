import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';

// providers
import { BwcProvider } from '../bwc/bwc';
import { OnGoingProcessProvider } from '../on-going-process/on-going-process';

@Injectable()
export class PayproProvider {
  constructor(
    private logger: Logger,
    private bwcProvider: BwcProvider,
    private onGoingProcessProvider: OnGoingProcessProvider
  ) {
    this.logger.debug('PayproProvider initialized');
  }

  public getPayProDetails(
    paymentUrl,
    coin,
    disableLoader?: boolean
  ): Promise<any> {
    const bwc = this.bwcProvider.getPayProV2();
    const options: any = {
      paymentUrl,
      chain: coin.toUpperCase(),
      currency: coin.toUpperCase() // TODO ERC20
    };
    if (!disableLoader) {
      this.onGoingProcessProvider.set('fetchingPayPro');
    }

    return bwc.selectPaymentOption(options).then(payProDetails => {
      if (!disableLoader) this.onGoingProcessProvider.clear();
      return payProDetails;
    });
  }
}
