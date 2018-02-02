import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';
import { TranslateService } from '@ngx-translate/core';

//providers
import { ProfileProvider } from '../profile/profile';
import { OnGoingProcessProvider } from '../on-going-process/on-going-process';

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

      if (!disableLoader) this.onGoingProcessProvider.set('fetchingPayPro', true);

      wallet.fetchPayPro({
        payProUrl: uri,
      }, (err, paypro) => {
        if (!disableLoader) this.onGoingProcessProvider.set('fetchingPayPro', false);
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
