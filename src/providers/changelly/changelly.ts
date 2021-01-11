import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';

// providers
import { Logger } from '../logger/logger';
import { PersistenceProvider } from '../persistence/persistence';

@Injectable()
export class ChangellyProvider {
  private env: string;
  private uri: string;

  public supportedCoins: string[];

  constructor(
    private http: HttpClient,
    private logger: Logger,
    private persistenceProvider: PersistenceProvider,
    private translate: TranslateService
  ) {
    this.logger.debug('ChangellyProvider initialized');
    this.env = 'production';
    this.uri = 'https://bws.bitpay.com/bws/api';
    this.supportedCoins = [
      'btc',
      'bch',
      'eth',
      'busd',
      'pax',
      'usdc',
      'gusd',
      'dai'
    ];
  }

  private generateMessageId(walletId?: string) {
    const now = Date.now();
    if (walletId) return `${walletId}-${now}`;
    const randomInt = Math.floor(1e8 * Math.random());
    return `${randomInt}-${now}`;
  }

  public getCurrencies(full?: boolean): Promise<any> {
    return new Promise((resolve, reject) => {
      const body = {
        id: this.generateMessageId(),
        full
      };

      const headers = new HttpHeaders({
        'Content-Type': 'application/json'
      });

      this.logger.debug(
        'Making a Changelly request with body: ' + JSON.stringify(body)
      );

      this.http
        .post(this.uri + '/v1/service/changelly/getCurrencies', body, {
          headers
        })
        .subscribe(
          (data: any) => {
            if (data.id && data.id != body.id)
              return reject(
                'The response does not match the origin of the request'
              );
            return resolve(data);
          },
          err => {
            return reject(err);
          }
        );
    });
  }

  public getPairsParams(wallet, data): Promise<any> {
    return new Promise((resolve, reject) => {
      const messageData = {
        id: this.generateMessageId(wallet.walletId),
        coinFrom: data.coinFrom,
        coinTo: data.coinTo
      };

      wallet
        .changellyGetPairsParams(messageData)
        .then(data => {
          if (data.id && data.id != messageData.id)
            return reject(
              'The response does not match the origin of the request'
            );
          return resolve(data);
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  public getFixRateForAmount(wallet, data): Promise<any> {
    return new Promise((resolve, reject) => {
      const messageData = {
        id: this.generateMessageId(wallet.walletId),
        coinFrom: data.coinFrom,
        coinTo: data.coinTo,
        amountFrom: data.amountFrom
      };

      wallet
        .changellyGetFixRateForAmount(messageData)
        .then(data => {
          if (data.id && data.id != messageData.id)
            return reject(
              'The response does not match the origin of the request'
            );
          return resolve(data);
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  public createFixTransaction(wallet, data): Promise<any> {
    return new Promise((resolve, reject) => {
      const messageData = {
        id: this.generateMessageId(wallet.walletId),
        coinFrom: data.coinFrom,
        coinTo: data.coinTo,
        addressTo: data.addressTo,
        amountFrom: data.amountFrom,
        fixedRateId: data.fixedRateId,
        refundAddress: data.refundAddress
      };

      wallet
        .changellyCreateFixTransaction(messageData)
        .then(data => {
          if (data.id && data.id != messageData.id)
            return reject(
              'The response does not match the origin of the request'
            );
          return resolve(data);
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  public getStatus(exchangeTxId: string, oldStatus: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const body = {
        id: this.generateMessageId(),
        exchangeTxId
      };

      const headers = new HttpHeaders({
        'Content-Type': 'application/json'
      });

      this.logger.debug(
        'Making a Changelly request with body: ' + JSON.stringify(body)
      );

      this.http
        .post(this.uri + '/v1/service/changelly/getStatus', body, {
          headers
        })
        .subscribe(
          (data: any) => {
            if (data.id && data.id != body.id)
              return reject(
                'The response does not match the origin of the request'
              );
            data.exchangeTxId = exchangeTxId;
            data.oldStatus = oldStatus;
            return resolve(data);
          },
          err => {
            return reject(err);
          }
        );
    });
  }

  public getStatusDetails(status: string) {
    let statusDescription: string, statusTitle: string;
    switch (status) {
      case 'new':
        statusTitle = this.translate.instant('New');
        statusDescription = this.translate.instant(
          'Transaction is waiting for an incoming payment.'
        );
        break;
      case 'waiting':
        statusTitle = this.translate.instant('Waiting');
        statusDescription = this.translate.instant(
          'Transaction is waiting for an incoming payment.'
        );
        break;
      case 'confirming':
        statusTitle = this.translate.instant('Confirming');
        statusDescription = this.translate.instant(
          'Changelly has received payin and is waiting for certain amount of confirmations depending of incoming currency.'
        );
        break;
      case 'exchanging':
        statusTitle = this.translate.instant('Exchanging');
        statusDescription = this.translate.instant(
          'Payment was confirmed and is being exchanged.'
        );
        break;
      case 'sending':
        statusTitle = this.translate.instant('Sending');
        statusDescription = this.translate.instant(
          'Coins are being sent to the recipient address.'
        );
        break;
      case 'finished':
        statusTitle = this.translate.instant('Finished');
        statusDescription = this.translate.instant(
          'Coins were successfully sent to the recipient address.'
        );
        break;
      case 'failed':
        statusTitle = this.translate.instant('Failed');
        statusDescription = this.translate.instant(
          `Transaction has failed. In most cases, the amount was less than the minimum.`
        );
        break;
      case 'refunded':
        statusTitle = this.translate.instant('Failed');
        statusDescription = this.translate.instant(
          "Exchange failed and coins were refunded to user's wallet."
        );
        break;
      case 'hold':
        statusTitle = this.translate.instant('Hold');
        statusDescription = this.translate.instant(
          'Due to AML/KYC procedure, exchange may be delayed.'
        );
        break;
      case 'expired':
        statusTitle = this.translate.instant('Expired');
        statusDescription = this.translate.instant(
          'Payin was not sent within the indicated timeframe.'
        );
        break;
      default:
        statusTitle = null;
        statusDescription = null;
        break;
    }
    return {
      statusTitle,
      statusDescription
    };
  }

  public saveChangelly(data, opts): Promise<any> {
    const env = this.env;
    return this.persistenceProvider.getChangelly(env).then(oldData => {
      if (_.isString(oldData)) {
        oldData = JSON.parse(oldData);
      }
      if (_.isString(data)) {
        data = JSON.parse(data);
      }
      let inv = oldData ? oldData : {};
      inv[data.exchangeTxId] = data;
      if (opts && (opts.error || opts.status)) {
        inv[data.exchangeTxId] = _.assign(inv[data.exchangeTxId], opts);
      }
      if (opts && opts.remove) {
        delete inv[data.exchangeTxId];
      }

      inv = JSON.stringify(inv);

      this.persistenceProvider.setChangelly(env, inv);
      return Promise.resolve();
    });
  }

  public getChangelly(): Promise<any> {
    const env = this.env;
    return this.persistenceProvider.getChangelly(env);
  }
}
