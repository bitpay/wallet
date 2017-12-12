import { Injectable } from '@angular/core';
import { Logger } from '@nsalaun/ng-logger';

//providers
import { ConfigProvider } from '../../providers/config/config';
import { BwcProvider } from '../../providers/bwc/bwc';

import * as _ from 'lodash';

@Injectable()
export class FeeProvider {

  private CACHE_TIME_TS: number = 60;
  // Constant fee options to translate
  public feeOpts: any = {
    urgent: 'Urgent', //TODO gettextcatalog
    priority: 'Priority',//TODO gettextcatalog
    normal: 'Normal',//TODO gettextcatalog
    economy: 'Economy',//TODO gettextcatalog
    superEconomy: 'Super Economy',//TODO gettextcatalog
    custom: 'Custom'//TODO gettextcatalog
  };
  private cache: any = {
    updateTs: 0,
    coin: ''
  }
  constructor(
    private configProvider: ConfigProvider,
    private logger: Logger,
    private bwcProvider: BwcProvider
  ) {
    this.logger.info('FeeProvider initialized.');
  }

  public getCurrentFeeLevel(): string {
    return this.configProvider.get().wallet.settings.feeLevel || 'normal';
  };

  public getFeeRate(coin: string, network: string, feeLevel: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (feeLevel == 'custom') return resolve();
      network = network || 'livenet';
      this.getFeeLevels(coin).then((response: any) => {
        let feeLevelRate: any;

        if (response.fromCache) {
          feeLevelRate = _.find(response.levels[network], (o) => {
            return o.level == feeLevel;
          });
        } else {
          feeLevelRate = _.find(response.levels[network], (o) => {
            return o.level == feeLevel;
          });
        }
        if (!feeLevelRate || !feeLevelRate.feePerKb) {
          let msg = "Could not get dynamic fee for level: " + feeLevel; //TODO gettextcatalog
          return reject(msg);
        }

        let feeRate = feeLevelRate.feePerKb;
        if (!response.fromCache) this.logger.debug('Dynamic fee: ' + feeLevel + '/' + network + ' ' + (feeLevelRate.feePerKb / 1000).toFixed() + ' SAT/B');
        return resolve(feeRate);
      }).catch((err) => {
        return reject(err);
      });
    })
  };

  public getCurrentFeeRate(coin: string, network: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getFeeRate(coin, network, this.getCurrentFeeLevel()).then((data: number) => {
        return resolve(data)
      }).catch((err: any) => {
        return reject(err);
      });
    });
  };

  public getFeeLevels(coin: string): Promise<any> {
    return new Promise((resolve, reject) => {
      coin = coin || 'btc';

      if (this.cache.coin == coin && this.cache.updateTs > Date.now() - this.CACHE_TIME_TS * 1000) {
        return resolve({ levels: this.cache.data, fromCache: true });
      }

      let walletClient = this.bwcProvider.getClient(null, {});

      walletClient.getFeeLevels(coin, 'livenet', (errLivenet, levelsLivenet) => {
        if (errLivenet) {
          return reject('Could not get dynamic fee'); //TODO gettextcatalog
        }
        walletClient.getFeeLevels('btc', 'testnet', (errTestnet, levelsTestnet) => {
          if (errTestnet) {
            return reject('Could not get dynamic fee'); //TODO gettextcatalog
          }
          this.cache.updateTs = Date.now();
          this.cache.coin = coin;
          this.cache.data = {
            'livenet': levelsLivenet,
            'testnet': levelsTestnet
          };
          return resolve({ levels: this.cache.data });
        });
      });
    });
  }


}
