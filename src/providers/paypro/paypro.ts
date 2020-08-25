import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';

// providers
import { BwcProvider } from '../bwc/bwc';
import { CurrencyProvider } from '../currency/currency';
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

  public async getPayProOptions(
    paymentUrl,
    disableLoader?: boolean,
    attempt: number = 1
  ): Promise<any> {
    this.logger.info('PayPro Options: try... ' + attempt);
    const bwc = this.bwcProvider.getPayProV2();
    const options: any = {
      paymentUrl
    };
    if (!disableLoader) {
      this.onGoingProcessProvider.set('fetchingPayProOptions');
    }
    const payOpts = await bwc.getPaymentOptions(options).catch(async err => {
      this.logger.error('PayPro Options: ERROR', JSON.stringify(err));
      if (attempt <= 5) {
        await new Promise(resolve => setTimeout(resolve, 3000 * attempt));
        return this.getPayProOptions(paymentUrl, disableLoader, ++attempt);
      } else {
        if (!disableLoader) this.onGoingProcessProvider.clear();
        throw err;
      }
    });
    if (!disableLoader) this.onGoingProcessProvider.clear();
    this.logger.info('PayPro Options: SUCCESS');
    return payOpts;
  }

  public async getPayProDetails(params: {
    paymentUrl;
    coin;
    address?: string;
    disableLoader?: boolean;
    attempt?: number;
  }): Promise<any> {
    let { paymentUrl, coin, address, disableLoader, attempt = 1 } = params;
    this.logger.info('PayPro Details: try... ' + attempt);
    const bwc = this.bwcProvider.getPayProV2();
    const chain = this.currencyProvider.getChain(coin).toUpperCase();
    const options: any = {
      paymentUrl,
      chain,
      currency: coin.toUpperCase(),
      address
    };
    if (!disableLoader) {
      this.onGoingProcessProvider.set('fetchingPayPro');
    }

    const payDetails = await bwc
      .selectPaymentOption(options)
      .catch(async err => {
        this.logger.error('PayPro Details: ERROR', JSON.stringify(err));
        if (attempt <= 5) {
          await new Promise(resolve => setTimeout(resolve, 3000 * attempt));
          return this.getPayProDetails({
            paymentUrl,
            coin,
            address,
            disableLoader,
            attempt: ++attempt
          });
        } else {
          if (!disableLoader) this.onGoingProcessProvider.clear();
          throw err;
        }
      });
    if (!disableLoader) this.onGoingProcessProvider.clear();
    this.logger.info('PayPro Details: SUCCESS');
    return payDetails;
  }
}
