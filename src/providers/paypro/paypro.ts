import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';

// providers
import { OnGoingProcessProvider } from '../on-going-process/on-going-process';
import { ProfileProvider } from '../profile/profile';

@Injectable()
export class PayproProvider {
  constructor(
    private profileProvider: ProfileProvider,
    private logger: Logger,
    private onGoingProcessProvider: OnGoingProcessProvider
  ) {
    this.logger.debug('PayproProvider initialized');
  }

  public getPayProDetails(
    uri: string,
    coin: string,
    disableLoader?: boolean
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const getPayPro = (network: string = 'livenet') => {
        return new Promise((resolve, reject) => {
          let wallet = this.profileProvider.getWallets({
            onlyComplete: true,
            coin,
            network
          })[0];

          if (!wallet) return resolve();

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
              else resolve(paypro);
            }
          );
        });
      };

      getPayPro()
        .then(paypro => {
          resolve(paypro);
        })
        .catch(err => {
          if (
            err &&
            err.message &&
            err.message.match(
              /The key on the response is not trusted for transactions/
            )
          ) {
            getPayPro('testnet')
              .then(paypro => {
                resolve(paypro);
              })
              .catch(err => {
                reject(err.message || err);
              });
          } else {
            return reject(err.message || err);
          }
        });
    });
  }
}
