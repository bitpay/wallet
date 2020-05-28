import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';

// providers
import { TranslateService } from '@ngx-translate/core';
import { BwcErrorProvider } from '../../providers/bwc-error/bwc-error';
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
    private errorsProvider: ErrorsProvider,
    private bwcErrorProvider: BwcErrorProvider
  ) {
    this.logger.debug('PayproProvider initialized');
  }

  public async getPayProOptions(paymentUrl, attempt: number = 1): Promise<any> {
    this.logger.info('PayPro Options: try... ' + attempt);
    const bwc = this.bwcProvider.getPayProV2();
    const options: any = {
      paymentUrl
    };
    const payOpts = await bwc.getPaymentOptions(options).catch(async err => {
      this.logger.error('PayPro Options: ERROR', JSON.stringify(err));
      if (attempt <= 5) {
        await new Promise(resolve => setTimeout(resolve, 3000 * attempt));
        return this.getPayProOptions(paymentUrl, ++attempt);
      } else throw err;
    });
    this.logger.info('PayPro Options: SUCCESS');
    return payOpts;
  }

  public async getPayProDetails(
    paymentUrl,
    coin,
    disableLoader?: boolean,
    attempt: number = 1
  ): Promise<any> {
    this.logger.info('PayPro Details: try... ' + attempt);
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

    const payDetails = await bwc
      .selectPaymentOption(options)
      .catch(async err => {
        this.logger.error('PayPro Details: ERROR', JSON.stringify(err));
        if (attempt <= 5) {
          await new Promise(resolve => setTimeout(resolve, 3000 * attempt));
          return this.getPayProDetails(paymentUrl, coin, true, ++attempt);
        } else {
          this.logger.debug(err);
          if (!disableLoader) this.onGoingProcessProvider.clear();
          this.errorsProvider.showDefaultError(
            this.bwcErrorProvider.msg(err),
            this.translate.instant('Could not fetch payment details')
          );
          throw err;
        }
      });
    if (!disableLoader) this.onGoingProcessProvider.clear();
    this.logger.info('PayPro Details: SUCCESS');
    return payDetails;
  }
}
