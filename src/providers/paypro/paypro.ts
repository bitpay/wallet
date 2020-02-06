import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';

// providers
import { BwcProvider } from '../bwc/bwc';
import { CurrencyProvider } from '../currency/currency';
import { ErrorsProvider } from '../errors/errors';
import { OnGoingProcessProvider } from '../on-going-process/on-going-process';

@Injectable()
export class PayproProvider {
  constructor(
    private logger: Logger,
    private bwcProvider: BwcProvider,
    private currencyProvider: CurrencyProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private errorsProvider: ErrorsProvider
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

    return bwc
      .getPaymentOptions(options)
      .then(payProOptions => {
        if (!disableLoader) this.onGoingProcessProvider.clear();
        return payProOptions;
      })
      .catch(error => {
        this.logger.debug(error);
        this.onGoingProcessProvider.clear();
        this.errorsProvider.showDefaultError(
          'Could not fetch payment options',
          'Error'
        );
      });
  }

  public getPayProDetails(
    paymentUrl,
    coin,
    disableLoader?: boolean
  ): Promise<any> {
    const bwc = this.bwcProvider.getPayProV2();
    const chain = this.currencyProvider.getChain(coin).toUpperCase();
    const options: any = {
      paymentUrl,
      chain,
      currency: coin.toUpperCase()
    };
    if (!disableLoader) {
      this.onGoingProcessProvider.set('fetchingPayPro');
    }

    return bwc
      .selectPaymentOption(options)
      .then(payProDetails => {
        if (!disableLoader) this.onGoingProcessProvider.clear();
        return payProDetails;
      })
      .catch(error => {
        this.logger.debug(error);
        this.onGoingProcessProvider.clear();
        this.errorsProvider.showDefaultError(
          'Could not fetch payment details',
          'Error'
        );
      });
  }
}
