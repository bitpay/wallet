import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';

// providers
import { BwcProvider } from '../bwc/bwc';
import { Coin, CurrencyProvider } from '../currency/currency';
import { OnGoingProcessProvider } from '../on-going-process/on-going-process';

@Injectable()
export class PayproProvider {
  constructor(
    private logger: Logger,
    private bwcProvider: BwcProvider,
    private currencyProvider: CurrencyProvider,
    private onGoingProcessProvider: OnGoingProcessProvider
  ) {
    this.logger.debug('PayproProvider initialized');
  }

  public getPayProOptions(paymentUrl, disableLoader?: boolean): Promise<any> {
    const bwc = this.bwcProvider.getPayProV2();
    const options: any = {
      paymentUrl
    };
    if (!disableLoader) {
      this.onGoingProcessProvider.set('fetchingPayProOptions');
    }

    return bwc.getPaymentOptions(options).then(payProOptions => {
      if (!disableLoader) this.onGoingProcessProvider.clear();
      return payProOptions;
    });
  }

  public getPayProDetails(
    paymentUrl,
    params: { coin: Coin; buyerProvidedEmail?: string },
    disableLoader?: boolean
  ): Promise<any> {
    const { coin, buyerProvidedEmail } = params;
    const bwc = this.bwcProvider.getPayProV2();
    const chain = this.currencyProvider.getChain(coin).toUpperCase();
    const options: any = {
      paymentUrl,
      chain,
      currency: coin.toUpperCase(),
      buyerProvidedEmail
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
