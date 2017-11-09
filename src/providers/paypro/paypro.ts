import { Injectable } from '@angular/core';
import { Logger } from '@nsalaun/ng-logger';

//providers
import { ProfileProvider } from '../profile/profile';
import { OnGoingProcessProvider } from '../on-going-process/on-going-process';

@Injectable()
export class PayproProvider {
  constructor(
    private profileProvider: ProfileProvider,
    private logger: Logger,
    private onGoingProcessProvider: OnGoingProcessProvider
  ) {
    console.log('Hello PayproProvider Provider');
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
          return reject('Payment Protocol Invalid'); //TODO gettextcatalog
        }
        return resolve(paypro);
      });
    });
  }
}
