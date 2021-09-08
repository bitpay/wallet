import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment';

// providers
import { Logger } from '../logger/logger';
import { PersistenceProvider } from '../persistence/persistence';

@Injectable()
export class OneInchProvider {
  private env: string;
  private bwsUri: string;
  private oneInchUri: string;

  constructor(
    private http: HttpClient,
    private logger: Logger,
    private persistenceProvider: PersistenceProvider
  ) {
    this.logger.debug('OneInchProvider initialized');
    this.env = 'production';
    this.bwsUri = 'https://bws.bitpay.com/bws/api'; // local test url: 'http://localhost:3232/bws/api';
    this.oneInchUri = 'https://bitpay.api.enterprise.1inch.exchange';
  }

  public getReferrerFee(): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = this.bwsUri + '/v1/service/oneInch/getReferrerFee';

      const headers = new HttpHeaders({
        'Content-Type': 'application/json'
      });

      this.logger.debug('Making getReferrerFee request');

      this.http.get(url, { headers }).subscribe(
        (data: any) => {
          const fee: number =
            data && data.referrerFee ? data.referrerFee : null;
          return resolve(fee);
        },
        err => {
          return reject(err);
        }
      );
    });
  }

  // Get array of all supported tokens (any erc20 token can be used in a quote and swap)
  public getCurrencies1inch(): Promise<any> {
    return new Promise((resolve, reject) => {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json'
      });

      this.logger.debug('Making getCurrencies1inch request');

      this.http
        .get(this.oneInchUri + '/v3.0/1/tokens', {
          headers
        })
        .subscribe(
          (data: any) => {
            return resolve(data);
          },
          err => {
            return reject(err);
          }
        );
    });
  }

  // Get quote and call data for an aggregated swap which can be used with a web3 provider to send the transaction
  public getQuote1inch(data): Promise<any> {
    return new Promise((resolve, reject) => {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json'
      });

      this.logger.debug('Making getQuote1inch request');

      this.http
        .get(this.oneInchUri + '/v3.0/1/quote', {
          headers,
          params: data
        })
        .subscribe(
          (data: any) => {
            return resolve(data);
          },
          err => {
            return reject(err);
          }
        );
    });
  }

  // Get swap
  public getSwap1inch(wallet, swapData): Promise<any> {
    return wallet.oneInchGetSwap(swapData);
  }

  // Get the address to which you need to approve before the swap transaction
  public approveSpender1inch() {
    return new Promise((resolve, reject) => {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json'
      });

      this.logger.debug('Making approveSpender1inch request');

      this.http
        .get(this.oneInchUri + '/v3.0/1/approve/spender', {
          headers
        })
        .subscribe(
          (data: any) => {
            return resolve(data);
          },
          err => {
            return reject(err);
          }
        );
    });
  }

  // Get a calldata for an approve transaction.
  // Before any swap request is called, make sure 1inch v3 has approval to spend the token being traded.
  public approveCalldata1inch(data) {
    return new Promise((resolve, reject) => {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json'
      });

      this.logger.debug('Making approveCalldata1inch request');

      this.http
        .get(this.oneInchUri + '/v3.0/1/approve/calldata', {
          headers,
          params: data
        })
        .subscribe(
          (data: any) => {
            return resolve(data);
          },
          err => {
            return reject(err);
          }
        );
    });
  }

  // Check if service is able to handle requests
  public healthCheck1inch() {
    return new Promise((resolve, reject) => {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json'
      });

      this.logger.debug('Making healthCheck1inch request');

      this.http
        .get(this.oneInchUri + '/v3.0/1/healthcheck', {
          headers
        })
        .subscribe(
          (data: any) => {
            return resolve(data);
          },
          err => {
            return reject(err);
          }
        );
    });
  }

  public verifyAllowancesAndBalances(data) {
    return new Promise((resolve, reject) => {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json'
      });

      const spenderAddress = data.spenderAddress
        ? data.spenderAddress
        : '0x11111112542d85b3ef69ae05771c2dccff4faa26'; // 1inch v3 contract address

      this.logger.debug('Making verifyAllowancesAndBalances request');
      const now = moment().unix() * 1000;

      // tokensFetchType property can be 'baseTokens' or 'customAndLpTokens'

      this.http
        .get(
          'https://balances.1inch.exchange/v1.1/1/allowancesAndBalances/' +
            spenderAddress +
            '/' +
            data.addressToCheck +
            '?tokensFetchType=baseTokens?t=' +
            now,
          {
            headers
          }
        )
        .subscribe(
          (data: any) => {
            return resolve(data);
          },
          err => {
            return reject(err);
          }
        );
    });
  }

  public saveOneInch(data, opts): Promise<any> {
    const env = this.env;
    if (opts && opts.isApprove) {
      return this.persistenceProvider.getOneInchApprove(env).then(oldData => {
        if (_.isString(oldData)) {
          oldData = JSON.parse(oldData);
        }
        if (_.isString(data)) {
          data = JSON.parse(data);
        }
        let inv = oldData ? oldData : {};
        inv[data.walletId] = data;

        if (opts && opts.remove) {
          delete inv[data.walletId];
        }

        inv = JSON.stringify(inv);

        this.persistenceProvider.setOneInchApprove(env, inv);
        return Promise.resolve();
      });
    } else {
      return this.persistenceProvider.getOneInch(env).then(oldData => {
        if (_.isString(oldData)) {
          oldData = JSON.parse(oldData);
        }
        if (_.isString(data)) {
          data = JSON.parse(data);
        }
        let inv = oldData ? oldData : {};
        inv[data.txId] = data;
        if (opts && (opts.error || opts.status)) {
          inv[data.txId] = _.assign(inv[data.txId], opts);
        }
        if (opts && opts.remove) {
          delete inv[data.txId];
        }

        inv = JSON.stringify(inv);

        this.persistenceProvider.setOneInch(env, inv);
        return Promise.resolve();
      });
    }
  }

  public getOneInch(): Promise<any> {
    const env = this.env;
    return this.persistenceProvider.getOneInch(env);
  }

  public getOneInchApproveData(): Promise<any> {
    const env = this.env;
    return this.persistenceProvider.getOneInchApprove(env);
  }
}
