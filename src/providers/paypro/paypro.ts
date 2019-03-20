import { Injectable } from '@angular/core';
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

      const getWallet = (network?: string) => {
        return this.profileProvider.getWallets({
          onlyComplete: true,
          coin,
          network: network || 'livenet'
        })[0];
      };

      let wallet = getWallet();
      if (!wallet) return resolve();

      this.logger.debug('Fetch PayPro Request...', uri);

      if (!disableLoader) {
        this.onGoingProcessProvider.set('fetchingPayPro');
      }

      const getPayPro = () => {
        return new Promise((resolve, reject) => {
          wallet.fetchPayPro(
            {
              payProUrl: uri
            },
            (err, paypro) => {
              if (!disableLoader) this.onGoingProcessProvider.clear();
              
              if (err) reject(err);
              else if (paypro && !paypro.verified) reject('Payment Protocol Invalid');
              else resolve(paypro);
            }
          );
        })
      };

      getPayPro().then((paypro: any) => {
        resolve(paypro);
      }).catch((err) => {
        if (_.isArrayBuffer(err)) {
          const enc = new encoding.TextDecoder();
          err = enc.decode(err);
          return reject(err);
        } else if (err && err.message && err.message.match(/The key on the response is not trusted for transactions/)) {
          wallet = getWallet('testnet');
          getPayPro().then((paypro) => {
            resolve(paypro);
          }).catch((err) => {
            reject(err.message || err);
          });
        } else {
          return reject(err.message || err);
        }
      });
    });
  }
}
