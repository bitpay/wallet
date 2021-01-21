import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';

// providers
import env from '../../environments';
import { AnalyticsProvider } from '../analytics/analytics';
import { AppProvider } from '../app/app';
import { ConfigProvider } from '../config/config';
import { HomeIntegrationsProvider } from '../home-integrations/home-integrations';
import { PersistenceProvider } from '../persistence/persistence';
import { PlatformProvider } from '../platform/platform';
import { RateProvider } from '../rate/rate';

import { Coin, CurrencyProvider } from '../currency/currency';

import * as _ from 'lodash';

const LIMIT: number = 100;

@Injectable()
export class CoinbaseProvider {
  private environment: string = env.name;
  private linkedAccount: boolean = false;
  private credentials;

  // URLs
  public supportUrl: string = 'https://support.coinbase.com';
  public signupUrl: string = 'https://www.coinbase.com/signup';
  public oauthUrl: string;

  // Access Token
  private isRefreshingToken: boolean;
  private accessToken: string;
  private refreshToken: string;

  public coinbaseData;
  private coinbaseExchange;

  constructor(
    private http: HttpClient,
    private logger: Logger,
    private persistenceProvider: PersistenceProvider,
    private platformProvider: PlatformProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private configProvider: ConfigProvider,
    private appProvider: AppProvider,
    private currencyProvider: CurrencyProvider,
    private analyticsProvider: AnalyticsProvider,
    private rateProvider: RateProvider
  ) {
    /*
     * Development: Gustavo's Account
     * Production: BitPay Account
     */
    this.logger.debug('Coinbase initialized: ' + this.environment);
    this.credentials = {};
    this.coinbaseData = {
      token: {},
      accounts: [],
      user: {},
      txs: {}
    };
  }

  public setCredentials() {
    if (
      !this.appProvider.servicesInfo ||
      !this.appProvider.servicesInfo.coinbase
    ) {
      return;
    }

    const coinbase = this.appProvider.servicesInfo.coinbase;

    this.credentials.REDIRECT_URI = this.platformProvider.isCordova
      ? coinbase.redirect_uri.mobile
      : coinbase.redirect_uri.desktop;

    // Force to use specific version
    this.credentials.API_VERSION = '2017-10-31'; // TODO: there is a newest version: 2020-02-11

    if (this.environment == 'development') {
      /*
       * Development: Gustavo's Coinbase Account
       */
      this.credentials.HOST = coinbase.sandbox.host;
      this.credentials.API = coinbase.sandbox.api;
      this.credentials.CLIENT_ID = coinbase.sandbox.client_id;
      this.credentials.CLIENT_SECRET = coinbase.sandbox.client_secret;
      this.credentials.SCOPE =
        '' +
        'wallet:accounts:read,' +
        'wallet:addresses:read,' +
        'wallet:addresses:create,' +
        'wallet:user:read,' +
        'wallet:user:email,' +
        'wallet:transactions:read,' +
        'wallet:transactions:send';

      // Set Authorize URL
      this.oauthUrl =
        this.credentials.HOST +
        '/oauth/authorize?response_type=code&client_id=' +
        this.credentials.CLIENT_ID +
        '&redirect_uri=' +
        this.credentials.REDIRECT_URI +
        '&account=all&state=SECURE_RANDOM&scope=' +
        this.credentials.SCOPE +
        '&meta[send_limit_amount]=1&meta[send_limit_currency]=USD&meta[send_limit_period]=day';
    } else {
      /*
       * Production: BitPay Account
       */
      this.credentials.HOST = coinbase.production.host;
      this.credentials.API = coinbase.production.api;
      this.credentials.CLIENT_ID = coinbase.production.client_id;
      this.credentials.CLIENT_SECRET = coinbase.production.client_secret;
      this.credentials.SCOPE =
        '' +
        'wallet:accounts:read,' +
        'wallet:addresses:read,' +
        'wallet:addresses:create,' +
        'wallet:user:read,' +
        'wallet:user:email,' +
        'wallet:transactions:read,' +
        'wallet:transactions:send,' +
        'wallet:transactions:send:bypass-2fa';

      // Set Authorize URL
      this.oauthUrl =
        this.credentials.HOST +
        '/oauth/authorize?response_type=code&client_id=' +
        this.credentials.CLIENT_ID +
        '&redirect_uri=' +
        this.credentials.REDIRECT_URI +
        '&account=all&state=SECURE_RANDOM&scope=' +
        this.credentials.SCOPE +
        '&meta[send_limit_amount]=1000&meta[send_limit_currency]=USD&meta[send_limit_period]=day';
    }
  }

  public getNativeCurrencyBalance(amount, currency): string {
    if (!this.coinbaseExchange) return null;
    if (!this.coinbaseExchange.rates[currency]) return null; // Coin rate has been removed from Coinbase
    return (amount / this.coinbaseExchange.rates[currency]).toFixed(2) || '0';
  }

  private parseErrorsAsString(e): string {
    let errData;

    try {
      if (e && e.errors) errData = e.errors;
      else if (e && e.error) errData = e.error_description;
      else return JSON.stringify(e);

      if (!_.isArray(errData)) {
        errData = errData && errData.message ? errData.message : errData;
        return errData;
      }

      if (_.isArray(errData)) {
        var errStr = '';
        for (var i = 0; i < errData.length; i++) {
          errStr = errStr + errData[i].message + '. ';
        }
        return errStr;
      }

      const msg = JSON.stringify(errData);
      this.logger.error('Coinbase:' + msg);
      return msg;
    } catch (e) {
      this.logger.error(e);
      return e;
    }
  }

  private isEnabled(): boolean {
    return !_.isEmpty(this.credentials.CLIENT_ID);
  }

  private getData(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.persistenceProvider
        .getCoinbase(this.environment)
        .then(data => {
          if (_.isString(data)) {
            try {
              data = JSON.parse(data);
            } catch (e) {
              this.logger.error('Coinbase: Parse file error', e);
              this.removeData();
              return resolve();
            }
          }
          return resolve(data);
        })
        .catch(e => {
          return reject(e);
        });
    });
  }

  private setData() {
    if (!this.linkedAccount) return;
    this.persistenceProvider.setCoinbase(this.environment, this.coinbaseData);
  }

  private removeData() {
    if (!this.linkedAccount) return;
    this.persistenceProvider.removeCoinbase(this.environment);
  }

  private debounceSetData = _.debounce(this.setData, 5000, {
    leading: false
  });

  private setTransactions(accountId, txs) {
    this.coinbaseData['txs'][accountId] = txs;
    this.debounceSetData();
  }

  private setToken(token) {
    this.coinbaseData['token'] = token;
    this.debounceSetData();
  }

  private setCurrentUser(user) {
    this.coinbaseData['user'] = user;
    this.debounceSetData();
  }

  private setAccounts(accounts) {
    this.coinbaseData['accounts'] = accounts;
    this.debounceSetData();
  }

  private setAccount(account) {
    let idxAccount = _.findIndex(this.coinbaseData['accounts'], {
      id: account.id
    });

    if (idxAccount == -1) {
      this.coinbaseData['accounts'].push(account);
    } else {
      this.coinbaseData['accounts'][idxAccount] = account;
    }
    this.debounceSetData();
  }

  private doRefreshToken(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.isRefreshingToken) {
        return reject('Refresh Token is in progress. Wait...');
      }

      this.isRefreshingToken = true;
      const url = this.credentials.HOST + '/oauth/token';
      const data = {
        grant_type: 'refresh_token',
        client_id: this.credentials.CLIENT_ID,
        client_secret: this.credentials.CLIENT_SECRET,
        redirect_uri: this.credentials.REDIRECT_URI,
        refresh_token: this.refreshToken
      };
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        Accept: 'application/json'
      });

      this.logger.debug('Coinbase: Getting Refresh Token...');
      this.http.post(url, data, { headers }).subscribe(
        data => {
          this.logger.info('Coinbase: Refresh Access Token SUCCESS');
          this._registerToken(data['access_token'], data['refresh_token']);
          this.setToken(data);
          return resolve();
        },
        data => {
          this.isRefreshingToken = false;
          this.logger.error(
            'Coinbase: Refresh Access Token ERROR ' + data.status
          );
          return reject(this.parseErrorsAsString(data.error));
        }
      );
    });
  }

  public linkAccount(code: string): Promise<any> {
    const url = this.credentials.HOST + '/oauth/token';
    const data = {
      grant_type: 'authorization_code',
      code,
      client_id: this.credentials.CLIENT_ID,
      client_secret: this.credentials.CLIENT_SECRET,
      redirect_uri: this.credentials.REDIRECT_URI
    };
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json'
    });

    this.logger.debug('Coinbase: Getting Token...');
    return new Promise((resolve, reject) => {
      if (!this.isEnabled()) {
        return reject('Coinbase is Disabled. Missing credentials.');
      }
      if (this.isLinked()) {
        return reject(
          'Coinbase already linked to the wallet. Please, logout before connect to a new one.'
        );
      }
      this.http.post(url, data, { headers }).subscribe(
        data => {
          this.logger.info('Coinbase: GET Access Token: SUCCESS');
          this._registerToken(data['access_token'], data['refresh_token']);
          this.setToken(data);
          this.preFetchAllData();
          this.logAccountLinked();
          return resolve();
        },
        data => {
          this.logger.error('Coinbase: GET Access Token: ERROR ' + data.status);
          return reject(this.parseErrorsAsString(data.error));
        }
      );
    });
  }

  public getAccounts(data?) {
    if (!this.isLinked()) return;
    const availableCoins = this.currencyProvider.getAvailableCoins();
    if (data) data['accounts'] = this.coinbaseData['accounts'] || [];
    // go to coinbase to update data
    this._getAccounts().then(remoteData => {
      let accounts = [];
      const allAccounts = remoteData.data;
      for (var i = 0; i < allAccounts.length; i++) {
        if (
          allAccounts[i].type == 'wallet' &&
          allAccounts[i].currency &&
          _.includes(availableCoins, allAccounts[i].currency.code.toLowerCase())
        ) {
          accounts.push(allAccounts[i]);
        }
      }
      const orderedAccounts = _.orderBy(accounts, ['name'], ['asc']);
      if (data) data['accounts'] = orderedAccounts;
      this.setAccounts(orderedAccounts);
    });
  }

  public getAccount(id, data) {
    if (!this.isLinked()) return;
    const acObject = _.find(this.coinbaseData['accounts'], { id });
    data['account'] = acObject || {};
    this._getAccount(id).then(remoteData => {
      const account = remoteData.data;
      data['account'] = account;
      this.setAccount(account);
    });
  }

  public getCurrentUser(data?) {
    if (!this.isLinked()) return;
    if (data) data['user'] = this.coinbaseData['user'] || {};
    this._getCurrentUser().then(remoteData => {
      const user = remoteData.data;
      if (data) data['user'] = user;
      this.setCurrentUser(user);
      if (!data) this.updateExchangeRates();
    });
  }

  public getTransactions(accountId, data) {
    if (!this.isLinked()) return;
    data['txs'] = this.coinbaseData['txs']
      ? this.coinbaseData['txs'][accountId]
      : [];
    this._getTransactions(accountId).then(remoteData => {
      const txs = remoteData.data;
      data['txs'] = txs;
      this.setTransactions(accountId, txs);
    });
  }

  public getAddress(accountId: string, label: string): Promise<any> {
    return this._createAddress(accountId, label);
  }

  public sendTransaction(
    accountId: string,
    tx: any,
    code?: string
  ): Promise<any> {
    return this._sendTransaction(accountId, tx, code);
  }

  public preFetchAllData(data?) {
    this.getCurrentUser(data);
    this.getAccounts(data);
  }

  private isExpiredTokenError(errors): boolean {
    for (let i = 0; i < errors.length; i++) {
      if (errors[i].id == 'expired_token') {
        this.logger.warn('Coinbase: Token has expired');
        return true;
      }
    }
    return false;
  }

  private _getAccounts(): Promise<any> {
    const url = this.credentials.API + '/v2' + '/accounts?&limit=' + LIMIT;
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'CB-VERSION': this.credentials.API_VERSION,
      Authorization: 'Bearer ' + this.accessToken
    };

    this.logger.debug('Coinbase: Getting Accounts...');
    return new Promise((resolve, reject) => {
      this.http.get(url, { headers }).subscribe(
        data => {
          this.logger.info('Coinbase: Get Accounts SUCCESS');
          return resolve(data);
        },
        data => {
          if (this.isExpiredTokenError(data.error.errors)) {
            this.doRefreshToken()
              .then(_ => {
                return this._getAccounts();
              })
              .catch(e => {
                this.logger.warn(e);
                setTimeout(() => {
                  return this._getAccounts();
                }, 5000);
              });
          } else {
            this.logger.error('Coinbase: Get Accounts ERROR ' + data.status);
            return reject(this.parseErrorsAsString(data.error));
          }
        }
      );
    });
  }

  private _getAccount(id: string): Promise<any> {
    const url = this.credentials.API + '/v2/accounts/' + id;
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'CB-VERSION': this.credentials.API_VERSION,
      Authorization: 'Bearer ' + this.accessToken
    };

    this.logger.debug('Coinbase: Getting Account...');
    return new Promise((resolve, reject) => {
      this.http.get(url, { headers }).subscribe(
        data => {
          this.logger.info('Coinbase: Get Account SUCCESS');
          return resolve(data);
        },
        data => {
          if (this.isExpiredTokenError(data.error.errors)) {
            this.doRefreshToken()
              .then(_ => {
                return this._getAccount(id);
              })
              .catch(e => {
                this.logger.warn(e);
                setTimeout(() => {
                  return this._getAccount(id);
                }, 5000);
              });
          } else {
            this.logger.error('Coinbase: Get Account ERROR ' + data.status);
            return reject(this.parseErrorsAsString(data.error));
          }
        }
      );
    });
  }

  private _getCurrentUser(): Promise<any> {
    const url = this.credentials.API + '/v2/user';
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'CB-VERSION': this.credentials.API_VERSION,
      Authorization: 'Bearer ' + this.accessToken
    };

    this.logger.debug('Coinbase: Getting Current User...');
    return new Promise((resolve, reject) => {
      this.http.get(url, { headers }).subscribe(
        data => {
          this.logger.info('Coinbase: Get Current User SUCCESS');
          return resolve(data);
        },
        data => {
          if (this.isExpiredTokenError(data.error.errors)) {
            this.doRefreshToken()
              .then(_ => {
                return this._getCurrentUser();
              })
              .catch(e => {
                this.logger.warn(e);
                setTimeout(() => {
                  return this._getCurrentUser();
                }, 5000);
              });
          } else {
            this.logger.error(
              'Coinbase: Get Current User ERROR ' + data.status
            );
            return reject(this.parseErrorsAsString(data.error));
          }
        }
      );
    });
  }

  private _getTransactions(accountId: string): Promise<any> {
    const url =
      this.credentials.API + '/v2/accounts/' + accountId + '/transactions';
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'CB-VERSION': this.credentials.API_VERSION,
      Authorization: 'Bearer ' + this.accessToken
    };

    this.logger.debug('Coinbase: Getting Transactions...');
    return new Promise((resolve, reject) => {
      this.http.get(url, { headers }).subscribe(
        data => {
          this.logger.info('Coinbase: Get Transactions SUCCESS');
          return resolve(data);
        },
        data => {
          if (this.isExpiredTokenError(data.error.errors)) {
            this.doRefreshToken()
              .then(_ => {
                return this._getTransactions(accountId);
              })
              .catch(e => {
                this.logger.warn(e);
                setTimeout(() => {
                  return this._getTransactions(accountId);
                }, 5000);
              });
          } else {
            this.logger.error(
              'Coinbase: Get Transactions ERROR ' + data.status
            );
            return reject(this.parseErrorsAsString(data.error));
          }
        }
      );
    });
  }

  private _createAddress(accountId: string, label: string): Promise<any> {
    const data = {
      name: label
    };
    const url =
      this.credentials.API + '/v2/accounts/' + accountId + '/addresses';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'CB-VERSION': this.credentials.API_VERSION,
      Authorization: 'Bearer ' + this.accessToken
    });

    this.logger.debug('Coinbase: Creating Address...');
    return new Promise((resolve, reject) => {
      this.http.post(url, data, { headers }).subscribe(
        data => {
          this.logger.info('Coinbase: Create Address SUCCESS');
          return resolve(data['data']); // return all data
        },
        data => {
          if (this.isExpiredTokenError(data.error.errors)) {
            this.doRefreshToken()
              .then(_ => {
                return this._createAddress(accountId, label);
              })
              .catch(e => {
                this.logger.warn(e);
                setTimeout(() => {
                  return this._createAddress(accountId, label);
                }, 5000);
              });
          } else {
            this.logger.error('Coinbase: Create Address ERROR ' + data.status);
            return reject(this.parseErrorsAsString(data.error));
          }
        }
      );
    });
  }

  private _sendTransaction(
    accountId: string,
    tx: any,
    code?: string
  ): Promise<any> {
    tx['type'] = 'send'; // Required for sending TX
    const url =
      this.credentials.API + '/v2/accounts/' + accountId + '/transactions';
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'CB-VERSION': this.credentials.API_VERSION,
      Authorization: 'Bearer ' + this.accessToken
    });

    if (code) headers = headers.append('CB-2FA-TOKEN', code); // 2FA if required

    this.logger.debug('Coinbase: Sending Transaction...');
    return new Promise((resolve, reject) => {
      this.http.post(url, tx, { headers }).subscribe(
        data => {
          this.logger.info('Coinbase: Send Transaction SUCCESS');
          return resolve(data);
        },
        data => {
          if (this.isExpiredTokenError(data.error.errors)) {
            this.doRefreshToken()
              .then(_ => {
                return this._sendTransaction(accountId, tx);
              })
              .catch(e => {
                this.logger.warn(e);
                setTimeout(() => {
                  return this._sendTransaction(accountId, tx);
                }, 5000);
              });
          } else if (data.status == 402) {
            this.logger.error('Coinbase: 2FA is required ' + data.status);
            return reject('2fa'); // return string to identify
          } else {
            this.logger.error(
              'Coinbase: Send Transaction ERROR ' + data.status
            );
            return reject(this.parseErrorsAsString(data.error));
          }
        }
      );
    });
  }

  public updateExchangeRates(): void {
    if (!this.coinbaseData || !this.coinbaseData['user']['native_currency'])
      return;
    const url =
      this.credentials.API +
      '/v2/exchange-rates' +
      '?currency=' +
      this.coinbaseData['user']['native_currency'];

    this.logger.debug('Coinbase: Getting Exchange Rates...');
    this.http.get(url).subscribe(
      data => {
        this.logger.info('Coinbase: Get Exchange Rates SUCCESS');
        this.coinbaseExchange = data['data'];
      },
      data => {
        this.logger.error('Coinbase: Get Exchange Rates ERROR ' + data.status);
      }
    );
  }

  private _registerToken(access_token: string, refresh_token: string): void {
    if (!access_token || !refresh_token) {
      this.logger.info('Coinbase: No token to register');
      return;
    }
    if (!this.linkedAccount)
      this.homeIntegrationsProvider.updateLink('coinbase', access_token); // Name, Token
    this.linkedAccount = true;
    this.accessToken = access_token;
    this.refreshToken = refresh_token;
    this.isRefreshingToken = false;
    this.logger.info('Coinbase: Token registered');
  }

  public logout() {
    this.removeData();
    this.linkedAccount = this.accessToken = this.refreshToken = null;
    this.coinbaseData = {
      token: {},
      accounts: [],
      user: {},
      txs: {}
    };
    this.homeIntegrationsProvider.updateLink('coinbase', null); // Name, Token
  }

  public isLinked(): boolean {
    if (!this.linkedAccount) this.logger.warn('Coinbase: Accounts not linked');
    return !!this.linkedAccount;
  }

  public logEvent(eventParams: { [key: string]: any }) {
    this.analyticsProvider.logEvent('coinbase', eventParams);
  }

  private logAccountLinked() {
    this.analyticsProvider.setUserProperty('hasLinkedCoinbaseAccount', 'true');
  }

  private isLinkedToOldSession(): Promise<boolean> {
    return new Promise(resolve => {
      this.persistenceProvider
        .getCoinbaseToken('livenet')
        .then(accessToken => {
          if (!accessToken) return resolve(false);
          return resolve(true);
        })
        .catch(_ => {
          return resolve(false);
        });
    });
  }

  public register(): void {
    this.isLinkedToOldSession().then(oldLinked => {
      this.getData().then(data => {
        this.coinbaseData = data || {
          token: {},
          accounts: [],
          user: {},
          txs: {}
        };

        if (this.coinbaseData && this.coinbaseData['token']) {
          this._registerToken(
            this.coinbaseData['token']['access_token'],
            this.coinbaseData['token']['refresh_token']
          );
          this.updateExchangeRates();
        }

        this.homeIntegrationsProvider.register({
          name: 'coinbase',
          title: 'Coinbase',
          icon: 'assets/img/coinbase/coinbase-icon.png',
          logo: 'assets/img/coinbase/coinbase-logo-white.svg',
          background: '#0667d0',
          location: '33 Countries',
          page: 'CoinbasePage',
          show: !!this.configProvider.get().showIntegration['coinbase'],
          linked: this.linkedAccount,
          email: this.coinbaseData['user']['email'] || null,
          oldLinked, // Register OLD existent users -> show a different banner
          type: 'exchange'
        });
      });
    });
  }

  public getAvailableAccounts(coin?, minFiatCurrency?: { amount; currency }) {
    let coinbaseData = _.cloneDeep(this.coinbaseData);
    let coinbaseAccounts = coinbaseData.accounts.filter(ac => {
      const nativeBalance = this.getNativeCurrencyBalance(
        ac.balance.amount,
        ac.balance.currency
      );
      ac.nativeCurrencyStr = nativeBalance
        ? nativeBalance + ' ' + this.coinbaseData['user']['native_currency']
        : null;
      const accountCoin = ac.balance.currency.toLowerCase();
      if (minFiatCurrency) {
        // check if it's crypto currency
        if (Coin[minFiatCurrency.currency]) {
          return Coin[minFiatCurrency.currency] == accountCoin;
        }
        const availableBalanceFiat = this.rateProvider.toFiat(
          this.currencyProvider.getPrecision(accountCoin).unitToSatoshi *
            Number(ac.balance.amount),
          minFiatCurrency.currency,
          accountCoin
        );
        return (
          availableBalanceFiat >=
          Number(
            minFiatCurrency && minFiatCurrency.amount
              ? minFiatCurrency.amount
              : null
          )
        );
      } else if (coin) {
        return accountCoin == coin;
      } else return ac;
    });
    return coinbaseAccounts;
  }

  public async payInvoice(
    invoiceId: string,
    currency: string,
    twoFactorCode?: string
  ): Promise<any> {
    if (!twoFactorCode) {
      try {
        await this.doRefreshToken();
      } catch (error) {
        this.logger.warn('Coinbase: the token could not be refreshed');
      }
    }
    return this._payInvoice(invoiceId, currency, twoFactorCode);
  }

  private _payInvoice(
    invoiceId: string,
    currency: string,
    twoFactorCode?: string
  ): Promise<any> {
    const url = 'https://bitpay.com/oauth/coinbase/pay/' + invoiceId;
    const data = {
      currency,
      token: this.accessToken,
      twoFactorCode
    };
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json'
    });
    return new Promise((resolve, reject) => {
      this.http.post(url, data, { headers }).subscribe(
        data => {
          this.logger.info('Coinbase: Pay invoice SUCCESS');
          return resolve(data);
        },
        data => {
          if (
            data.error &&
            data.error.errors &&
            data.error.errors[0].id == 'two_factor_required'
          ) {
            this.logger.error('Coinbase: 2FA is required ' + data.status);
            return reject('2fa'); // return string to identify
          } else {
            this.logger.error(
              'Coinbase: Send Transaction ERROR ' + data.status
            );
            return reject(this.parseErrorsAsString(data.error));
          }
        }
      );
    });
  }
}
