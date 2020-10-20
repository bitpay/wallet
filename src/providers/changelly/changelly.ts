import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';

// providers
import env from '../../environments';
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
    this.env = env.name == 'development' ? 'sandbox' : 'production';
    this.uri = 'http://localhost:3232/bws/api'; // https://bws.bitpay.com/bws/api
  }

  public getCurrencies(full?: boolean) {
    const message = {
      jsonrpc: '2.0',
      id: 'test',
      method: full ? 'getCurrenciesFull' : 'getCurrencies',
      params: {}
    };

    return this.doChangellyRequest(message);
  }

  public getMinAmount(data): Promise<any> {
    const message = {
      jsonrpc: '2.0',
      id: 'test',
      method: 'getMinAmount',
      params: {
        from: data.coinFrom,
        to: data.coinTo
      }
    };

    return this.doChangellyRequest(message);
  }

  public getFixRate(data): Promise<any> {
    const message = {
      id: 'test',
      jsonrpc: '2.0',
      method: 'getFixRate',
      params: [
        {
          from: data.coinFrom,
          to: data.coinTo
        }
      ]
    };

    return this.doChangellyRequest(message);
  }

  public getPairsParams(data): Promise<any> {
    const message = {
      id: 'test',
      jsonrpc: '2.0',
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
      id: 'test',
      jsonrpc: '2.0',
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
      id: 'test',
      jsonrpc: '2.0',
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

  public getStatus(data): Promise<any> {
    const message = {
      jsonrpc: '2.0',
      id: 'test',
      method: 'getStatus',
      params: {
        id: data.exchangeTxId
      }
    };

    return this.doChangellyRequest(message);
  }

  private doChangellyRequest(message): Promise<any> {
    return new Promise((resolve, reject) => {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json'
      });

      this.http
        .post(this.uri + '/v1/service/changelly/makeRequest', message, {
          headers
        })
        .subscribe(
          data => {
            console.log('===== copay getRates data success: ', data);
            return resolve(data);
          },
          err => {
            console.log('===== copay getRates err: ', err);
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
