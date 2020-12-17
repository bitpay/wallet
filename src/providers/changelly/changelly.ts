import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';

// providers
import { Logger } from '../logger/logger';
import { PersistenceProvider } from '../persistence/persistence';

@Injectable()
export class ChangellyProvider {
  private env: string;
  private uri: string;

  constructor(
    private http: HttpClient,
    private logger: Logger,
    private persistenceProvider: PersistenceProvider
  ) {
    this.logger.debug('ChangellyProvider initialized');
    this.env = 'production';
    this.uri = 'https://bws.bitpay.com/bws/api';
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
