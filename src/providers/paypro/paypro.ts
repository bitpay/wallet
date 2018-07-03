import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Logger } from '../../providers/logger/logger';

import * as _ from 'lodash';
import encoding from 'text-encoding';

// providers
import { OnGoingProcessProvider } from '../on-going-process/on-going-process';
import { ProfileProvider } from '../profile/profile';

@Injectable()
export class PayproProvider {
  constructor(
    private profileProvider: ProfileProvider,
    private logger: Logger,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private translate: TranslateService
  ) {
    this.logger.info('PayproProvider initialized');
  }

  public getPayProDetails(
    uri: string,
    coin: string,
    disableLoader?: boolean
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      let wallet = this.profileProvider.getWallets({
        onlyComplete: true,
        coin
      })[0];

      if (!wallet) return resolve();

      this.logger.debug('Fetch PayPro Request...', uri);

      if (disableLoader) {
        this.onGoingProcessProvider.set('');
      } else {
        this.onGoingProcessProvider.set('fetchingPayPro');
      }

      wallet.fetchPayPro(
        {
          payProUrl: uri
        },
        (err, paypro) => {
          this.onGoingProcessProvider.clear();
          if (_.isArrayBuffer(err)) {
            const enc = new encoding.TextDecoder();
            err = enc.decode(err);
            return reject(err);
          } else if (err)
            return reject(
              this.translate.instant(
                'Could Not Fetch Payment: Check if it is still valid'
              )
            );
          else if (!paypro.verified) {
            this.logger.warn('Failed to verify payment protocol signatures');
            return reject(this.translate.instant('Payment Protocol Invalid'));
          }
          return resolve(paypro);
        }
      );
    });
  }
}
