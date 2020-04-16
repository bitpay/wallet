import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';

// providers
import { TranslateService } from '@ngx-translate/core';
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
    private translate: TranslateService,
    private errorsProvider: ErrorsProvider
  ) {
    this.logger.debug('PayproProvider initialized');
  }

  public getPayProOptions(paymentUrl): Promise<any> {
    const bwc = this.bwcProvider.getPayProV2();
    const options: any = {
      paymentUrl
    };
    return bwc.getPaymentOptions(options);
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
          this.translate.instant('Could not fetch payment details'),
          'Error'
        );
      });
  }
}
