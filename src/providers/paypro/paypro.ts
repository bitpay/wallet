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
    this.logger.debug('PayproProvider initialized');
  }

  public getPayProDetails(
    uri: string,
    coin: string,
    disableLoader?: boolean
  ): Promise<any> {
    const getPayPro = (network: string = 'livenet') => {
      return new Promise((resolve, reject) => {
        let wallet = this.profileProvider.getWallets({
          onlyComplete: true,
          coin,
          network
        })[0];

        if (!wallet && network === 'livenet')
          return reject('NO_LIVENET_WALLETS');
        else if (!wallet) return resolve();

        this.logger.debug(`Fetch PayPro Request (${network})...`, uri);
        if (!disableLoader) {
          this.onGoingProcessProvider.set('fetchingPayPro');
        }

        wallet.fetchPayPro(
          {
            payProUrl: uri
          },
          (err, paypro) => {
            if (!disableLoader) this.onGoingProcessProvider.clear();
            if (err) reject(err);
            else if (paypro && !paypro.verified)
              reject('Payment Protocol Invalid');
            else {
              // URI is needed to identify host
              paypro.payProUrl = uri;
              resolve(paypro);
            }
          }
        );
      });
    };

    return getPayPro()
      .catch(err => {
        if (err == 'NO_LIVENET_WALLETS' || this.checkIfNetworkError(err)) {
          return getPayPro('testnet');
        }
        throw err;
      })
      .catch(err => {
        if (this.checkIfNetworkError(err)) {
          return Promise.reject(
            this.translate.instant(
              `The key on the response is not trusted for transactions on the 'test' network`
            )
          );
        }
        if (this.checkIfExpiredInvoiceError(err)) {
          return Promise.reject(
            this.translate.instant(
              'The invoice is no longer receiving payments.'
            )
          );
        }
        return Promise.reject(err.message || err);
      });
  }

  private checkIfNetworkError(err) {
    return (
      err &&
      err.message &&
      err.message.match(
        /The key on the response is not trusted for transactions/
      )
    );
  }

  private checkIfExpiredInvoiceError(err) {
    return (
      err &&
      err.message &&
      err.message.match(/The invoice is no longer receiving payments/)
    );
  }
}
