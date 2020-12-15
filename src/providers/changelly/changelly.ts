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
  private jsonrpc: string;

  constructor(
    private http: HttpClient,
    private logger: Logger,
    private persistenceProvider: PersistenceProvider
  ) {
    this.logger.debug('ChangellyProvider initialized');
    this.env = 'production';
    this.uri = 'https://bws.bitpay.com/bws/api';
    this.jsonrpc = '2.0';
  }

  private generateMessageId(walletId?: string) {
    const now = Date.now();
    if (walletId) return `${walletId}-${now}`;
    const randomInt = Math.floor(1e8 * Math.random());
    return `${randomInt}-${now}`;
  }

  public getCurrencies(full?: boolean) {
    const message = {
      jsonrpc: this.jsonrpc,
      id: this.generateMessageId(),
      method: full ? 'getCurrenciesFull' : 'getCurrencies',
      params: {}
    };

    return this.doChangellyRequest(message);
  }

  public getPairsParams(data): Promise<any> {
    const message = {
      id: this.generateMessageId(data.walletId),
      jsonrpc: this.jsonrpc,
      method: 'getPairsParams',
      params: [
        {
          from: data.coinFrom,
          to: data.coinTo
        }
      ]
    };

    return this.doChangellyRequest(message);
  }

  public getFixRateForAmount(data): Promise<any> {
    const message = {
      id: this.generateMessageId(data.walletId),
      jsonrpc: this.jsonrpc,
      method: 'getFixRateForAmount',
      params: [
        {
          from: data.coinFrom,
          to: data.coinTo,
          amountFrom: data.amountFrom
        }
      ]
    };

    return this.doChangellyRequest(message);
  }

  public createFixTransaction(data): Promise<any> {
    const message = {
      id: this.generateMessageId(data.walletId),
      jsonrpc: this.jsonrpc,
      method: 'createFixTransaction',
      params: {
        from: data.coinFrom,
        to: data.coinTo,
        address: data.addressTo,
        amountFrom: data.amountFrom,
        rateId: data.fixedRateId,
        refundAddress: data.refundAddress
      }
    };

    return this.doChangellyRequest(message);
  }

  public getStatus(exchangeTxId: string, oldStatus: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const message = {
        jsonrpc: this.jsonrpc,
        id: this.generateMessageId(),
        method: 'getStatus',
        params: {
          id: exchangeTxId
        }
      };

      this.doChangellyRequest(message)
        .then(data => {
          console.log('data: ', data);
          data.exchangeTxId = exchangeTxId;
          data.oldStatus = oldStatus;
          console.log('data: ', data);
          return resolve(data);
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  private doChangellyRequest(message): Promise<any> {
    return new Promise((resolve, reject) => {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json'
      });

      this.logger.debug(
        'Making a Changelly request: ' + JSON.stringify(message)
      );

      this.http
        .post(this.uri + '/v1/service/changelly/makeRequest', message, {
          headers
        })
        .subscribe(
          (data: any) => {
            if (data.id && data.id != message.id)
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
