import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Logger } from '../../providers/logger/logger';

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

  public getPayProDetails(uri: string, disableLoader?: boolean): Promise<any> {
    return new Promise((resolve, reject) => {

      let wallet: any = this.profileProvider.getWallets({
        onlyComplete: true
      })[0];

      if (!wallet) return resolve();

      this.logger.debug('Fetch PayPro Request...', uri);

      if (!disableLoader) this.onGoingProcessProvider.set('fetchingPayPro');

      wallet.fetchPayPro({
        payProUrl: uri,
      }, (err, paypro) => {
        if (!disableLoader) this.onGoingProcessProvider.clear();
        if (err) return reject(err);
        else if (!paypro.verified) {
          this.logger.warn('Failed to verify payment protocol signatures');
          return reject(this.translate.instant('Payment Protocol Invalid'));
        }
        return resolve(paypro);
      });
    });
  }
}
