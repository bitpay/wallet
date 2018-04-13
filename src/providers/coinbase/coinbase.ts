
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Events } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';

// providers
import { AppProvider } from '../app/app';
import { ConfigProvider } from '../config/config';
import { FeeProvider } from '../fee/fee';
import { HomeIntegrationsProvider } from '../home-integrations/home-integrations';
import { PersistenceProvider } from '../persistence/persistence';
import { PlatformProvider } from '../platform/platform';

import * as _ from "lodash";

@Injectable()
export class CoinbaseProvider {

  private credentials: any;
  private isCordova: boolean;

  public priceSensitivity: any;
  public selectedPriceSensitivity: any;

  constructor(
    private http: HttpClient,
    private logger: Logger,
    private persistenceProvider: PersistenceProvider,
    private platformProvider: PlatformProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private configProvider: ConfigProvider,
    private feeProvider: FeeProvider,
    private appProvider: AppProvider,
    private events: Events
  ) {
    this.logger.info('Coinbase initialized.');
    this.credentials = {};
    this.isCordova = this.platformProvider.isCordova;

    this.priceSensitivity = [{
      value: 0.5,
      name: '0.5%'
    }, {
      value: 1,
      name: '1%'
    }, {
      value: 2,
      name: '2%'
    }, {
      value: 5,
      name: '5%'
    }, {
      value: 10,
      name: '10%'
    }];

    this.selectedPriceSensitivity = this.priceSensitivity[1];

    this.events.subscribe('bwsEvent', (walletId, type, n) => {
      if (type == 'NewBlock' && n && n.data && n.data.network == 'livenet') {
        this.isActive((err, isActive) => {
          // Update Coinbase
          if (isActive)
            this.updatePendingTransactions();
        });
      }
    });
  }


  public setCredentials() {

    if (!this.appProvider.servicesInfo || !this.appProvider.servicesInfo.coinbase) {
      return;
    }

    var coinbase = this.appProvider.servicesInfo.coinbase;

    /*
     * Development: 'testnet'
     * Production: 'livenet'
     */
    this.credentials.NETWORK = 'livenet';

    // Coinbase permissions
    this.credentials.SCOPE = '' +
      'wallet:accounts:read,' +
      'wallet:addresses:read,' +
      'wallet:addresses:create,' +
      'wallet:user:read,' +
      'wallet:user:email,' +
      'wallet:buys:read,' +
      'wallet:buys:create,' +
      'wallet:sells:read,' +
      'wallet:sells:create,' +
      'wallet:transactions:read,' +
      'wallet:transactions:send,' +
      'wallet:transactions:send:bypass-2fa,' +
      'wallet:payment-methods:read';

    // NW has a bug with Window Object
    this.credentials.REDIRECT_URI = this.isCordova
      ? coinbase.redirect_uri.mobile
      : coinbase.redirect_uri.desktop;

    if (this.credentials.NETWORK == 'testnet') {
      this.credentials.HOST = coinbase.sandbox.host;
      this.credentials.API = coinbase.sandbox.api;
      this.credentials.CLIENT_ID = coinbase.sandbox.client_id;
      this.credentials.CLIENT_SECRET = coinbase.sandbox.client_secret;
    } else {
      this.credentials.HOST = coinbase.production.host;
      this.credentials.API = coinbase.production.api;
      this.credentials.CLIENT_ID = coinbase.production.client_id;
      this.credentials.CLIENT_SECRET = coinbase.production.client_secret;
    };

    // Force to use specific version
    this.credentials.API_VERSION = '2017-10-31';
  }

  private _afterTokenReceived(data, cb) {
    if (data && data.access_token && data.refresh_token) {
      this.persistenceProvider.setCoinbaseToken(this.credentials.NETWORK, data.access_token)
      this.persistenceProvider.setCoinbaseRefreshToken(this.credentials.NETWORK, data.refresh_token)
      this.homeIntegrationsProvider.updateLink('coinbase', data.access_token); // Name, Token
      return cb(null, data.access_token);
    } else {
      return cb('Could not get the access token');
    }
  }

  public getErrorsAsString(data: any): string {
    let errData: any;

    try {
      if (data && data.errors) errData = data.errors;
      else if (data && data.error) errData = data.error_description;
      else return 'Unknown error';

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

      return JSON.stringify(errData);
    } catch (e) {
      this.logger.error(e);
    }
  }

  public getNetwork() {
    return this.credentials.NETWORK;
  }

  public getStoredToken(cb) {
    this.persistenceProvider.getCoinbaseToken(this.credentials.NETWORK).then((accessToken) => {
      if (!accessToken) return cb();
      return cb(accessToken);
    }).catch((err) => {
      return cb(err);
    });
  }

  public getAvailableCurrency() {
    var config = this.configProvider.get().wallet.settings;
    // ONLY "USD"
    switch (config.alternativeIsoCode) {
      default: return 'USD'
    };
  }

  public checkEnoughFundsForFee(amount, cb) {
    this._getNetAmount(amount, (err, reducedAmount) => {
      if (err) return cb(err);

      // Check if transaction has enough funds to transfer bitcoin from Coinbase to Copay
      if (reducedAmount < 0) {
        return cb('Not enough funds for fee');
      }

      return cb();
    });
  }

  public getSignupUrl() {
    return this.credentials.HOST + '/signup';
  }

  public getSupportUrl() {
    return 'https://support.coinbase.com/';
  }

  public getOauthCodeUrl() {
    return this.credentials.HOST +
      '/oauth/authorize?response_type=code&client_id=' +
      this.credentials.CLIENT_ID +
      '&redirect_uri=' +
      this.credentials.REDIRECT_URI +
      '&state=SECURE_RANDOM&scope=' +
      this.credentials.SCOPE +
      '&meta[send_limit_amount]=1000&meta[send_limit_currency]=USD&meta[send_limit_period]=day';
  }

  private _getNetAmount(amount, cb) {
    // Fee Normal for a single transaction (450 bytes)
    var txNormalFeeKB = 450 / 1000;
    this.feeProvider.getFeeRate('btc', 'livenet', 'normal').then((feePerKb) => {
      var feeBTC = (feePerKb * txNormalFeeKB / 100000000).toFixed(8);

      return cb(null, amount - parseInt(feeBTC, 10), parseInt(feeBTC, 10));
    }).catch((err) => {
      return cb('Could not get fee rate');
    });
  };

  public getToken(code, cb) {
    let url = this.credentials.HOST + '/oauth/token';
    let data = {
      grant_type: 'authorization_code',
      code,
      client_id: this.credentials.CLIENT_ID,
      client_secret: this.credentials.CLIENT_SECRET,
      redirect_uri: this.credentials.REDIRECT_URI
    };
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    this.http.post(url, data, { headers }).subscribe((data: any) => {
      this.logger.info('Coinbase: GET Access Token: SUCCESS');
      // Show pending task from the UI
      this._afterTokenReceived(data, cb);
    }, (data) => {
      this.logger.error('Coinbase: GET Access Token: ERROR ' + data.status + '. ' + this.getErrorsAsString(data.error));
      return cb(data.error);
    });
  }

  private _refreshToken(refreshToken, cb) {
    let url = this.credentials.HOST + '/oauth/token';
    let data = {
      grant_type: 'refresh_token',
      client_id: this.credentials.CLIENT_ID,
      client_secret: this.credentials.CLIENT_SECRET,
      redirect_uri: this.credentials.REDIRECT_URI,
      refresh_token: refreshToken
    };
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    this.http.post(url, data, { headers }).subscribe((data: any) => {
      this.logger.info('Coinbase: Refresh Access Token SUCCESS');
      this._afterTokenReceived(data, cb);
    }, (data) => {
      this.logger.error('Coinbase: Refresh Access Token ERROR ' + data.status + '. ' + this.getErrorsAsString(data.error));
      return cb(data.error);
    });
  }

  private _getMainAccountId(accessToken, cb) {
    this.getAccounts(accessToken, (err, a) => {
      if (err) return cb(err);
      var data = a.data;
      for (var i = 0; i < data.length; i++) {
        if (data[i].primary && data[i].type == 'wallet' && data[i].currency && data[i].currency.code == 'BTC') {
          return cb(null, data[i].id);
        }
      }
      this.logout();
      return cb('Your primary account should be a BTC WALLET. Set your wallet account as primary and try again');
    });
  };

  private getAccounts(token, cb) {
    if (!token) return cb('Invalid Token');

    let url = this.credentials.API + '/v2' + '/accounts';
    let headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'CB-VERSION': this.credentials.API_VERSION,
      'Authorization': 'Bearer ' + token
    };

    this.http.get(url, { headers }).subscribe((data: any) => {
      this.logger.info('Coinbase: Get Accounts SUCCESS');
      return cb(null, data);
    }, (data) => {
      this.logger.error('Coinbase: Get Accounts ERROR ' + data.status + '. ' + this.getErrorsAsString(data.error));
      return cb(data.error);
    });
  }

  public logout() {
    this.persistenceProvider.removeCoinbaseToken(this.credentials.NETWORK);
    this.persistenceProvider.removeCoinbaseRefreshToken(this.credentials.NETWORK);
    this.persistenceProvider.removeCoinbaseTxs(this.credentials.NETWORK);
    this.homeIntegrationsProvider.updateLink('coinbase', null); // Name, Token
  }


  public isActive(cb) {
    if (_.isEmpty(this.credentials.CLIENT_ID))
      return cb(false);

    this.persistenceProvider.getCoinbaseToken(this.credentials.NETWORK).then((accessToken) => {
      return cb(!!accessToken);
    });
  }

  public init = _.throttle((cb) => {
    if (_.isEmpty(this.credentials.CLIENT_ID)) {
      return cb('Coinbase is Disabled. Missing credentials.');
    }
    this.logger.debug('Trying to initialise Coinbase...');

    this.persistenceProvider.getCoinbaseToken(this.credentials.NETWORK).then((accessToken) => {
      if (!accessToken) return cb();
      this._getMainAccountId(accessToken, (err, accountId) => {
        if (err) {
          if (!err.errors) return cb(err);
          if (err.errors && !_.isArray(err.errors)) return cb(err);

          let expiredToken;
          for (let i = 0; i < err.errors.length; i++) {
            if (err.errors[i].id == 'expired_token') expiredToken = true;
          }

          if (expiredToken) {
            this.logger.debug('Refresh token');
            this.persistenceProvider.getCoinbaseRefreshToken(this.credentials.NETWORK).then((refreshToken) => {
              this._refreshToken(refreshToken, (err, newToken) => {
                if (err) return cb(err);
                this._getMainAccountId(newToken, (err, accountId) => {
                  if (err) return cb(err);
                  return cb(null, {
                    accessToken: newToken,
                    accountId
                  });
                });
              });
            }).catch((err) => {
              return cb(err);
            });
          } else {
            return cb(err);
          }
        } else {
          return cb(null, {
            accessToken,
            accountId
          });
        }
      });
    }).catch((err) => {
      return cb();
    });
  }, 10000);

  public getAccount(token, accountId, cb) {
    if (!token) return cb('Invalid Token');
    let url = this.credentials.API + '/v2/accounts/';
    let headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'CB-VERSION': this.credentials.API_VERSION,
      'Authorization': 'Bearer ' + token
    }
    this.http.get(url, { headers }).subscribe((data: any) => {
      this.logger.info('Coinbase: Get Account SUCCESS');
      return cb(null, data);
    }, (data) => {
      this.logger.error('Coinbase: Get Account ERROR ' + data.status + '. ' + this.getErrorsAsString(data.error));
      return cb(data.error);
    });
  }

  public getAuthorizationInformation(token, cb) {
    if (!token) return cb('Invalid Token');
    let url = this.credentials.API + '/v2/user/auth';
    let headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'CB-VERSION': this.credentials.API_VERSION,
      'Authorization': 'Bearer ' + token
    };
    this.http.get(url, { headers }).subscribe((data: any) => {
      this.logger.info('Coinbase: Autorization Information SUCCESS');
      return cb(null, data);
    }, (data) => {
      this.logger.error('Coinbase: Autorization Information ERROR ' + data.status + '. ' + this.getErrorsAsString(data.error));
      return cb(data.error);
    });
  }

  public getCurrentUser(token, cb) {
    if (!token) return cb('Invalid Token');
    let url = this.credentials.API + '/v2/user';
    let headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'CB-VERSION': this.credentials.API_VERSION,
      'Authorization': 'Bearer ' + token
    };

    this.http.get(url, { headers }).subscribe((data: any) => {
      this.logger.info('Coinbase: Get Current User SUCCESS');
      return cb(null, data);
    }, (data) => {
      this.logger.error('Coinbase: Get Current User ERROR ' + data.status + '. ' + this.getErrorsAsString(data.error));
      return cb(data.error);
    });
  }

  public getBuyOrder(token, accountId, buyId, cb) {
    if (!token) return cb('Invalid Token');
    let url = this.credentials.API + '/v2/accounts/' + accountId + '/buys/' + buyId;
    let headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'CB-VERSION': this.credentials.API_VERSION,
      'Authorization': 'Bearer ' + token
    };

    this.http.get(url, { headers }).subscribe((data: any) => {
      this.logger.info('Coinbase: Buy Info SUCCESS');
      return cb(null, data);
    }, (data) => {
      this.logger.error('Coinbase: Buy Info ERROR ' + data.status + '. ' + this.getErrorsAsString(data.error));
      return cb(data.error);
    });
  }

  public getTransaction(token, accountId, transactionId, cb) {
    if (!token) return cb('Invalid Token');
    let url = this.credentials.API + '/v2/accounts/' + accountId + '/transactions/' + transactionId;
    let headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'CB-VERSION': this.credentials.API_VERSION,
      'Authorization': 'Bearer ' + token
    };
    this.http.get(url, { headers }).subscribe((data: any) => {
      this.logger.info('Coinbase: Transaction SUCCESS');
      return cb(null, data);
    }, (data) => {
      this.logger.error('Coinbase: Transaction ERROR ' + data.status + '. ' + this.getErrorsAsString(data.error));
      return cb(data.error);
    });
  }


  public getAddressTransactions(token, accountId, addressId, cb) {
    if (!token) return cb('Invalid Token');

    let url = this.credentials.API + '/v2/accounts/' + accountId + '/addresses/' + addressId + '/transactions';
    let headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'CB-VERSION': this.credentials.API_VERSION,
      'Authorization': 'Bearer ' + token
    };

    this.http.get(url, { headers }).subscribe((data: any) => {
      this.logger.info('Coinbase: Address Transactions SUCCESS');
      return cb(null, data);
    }, (data) => {
      this.logger.error('Coinbase: Address Transactions ERROR ' + data.status + '. ' + this.getErrorsAsString(data.error));
      return cb(data.error);
    });
  }

  public getTransactions(token, accountId, cb) {
    if (!token) return cb('Invalid Token');
    let url = this.credentials.API + '/v2/accounts/' + accountId + '/transactions';
    let headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'CB-VERSION': this.credentials.API_VERSION,
      'Authorization': 'Bearer ' + token
    };

    this.http.get(url, { headers }).subscribe((data: any) => {
      this.logger.info('Coinbase: Transactions SUCCESS');
      return cb(null, data);
    }, (data: any) => {
      this.logger.error('Coinbase: Transactions ERROR ' + data.status + '. ' + this.getErrorsAsString(data.error));
      return cb(data.error);
    });
  }


  public paginationTransactions(token, Url, cb) {
    if (!token) return cb('Invalid Token');

    let url = this.credentials.API + Url;
    let headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'CB-VERSION': this.credentials.API_VERSION,
      'Authorization': 'Bearer ' + token
    };

    this.http.get(url, { headers }).subscribe((data: any) => {
      this.logger.info('Coinbase: Pagination Transactions SUCCESS');
      return cb(null, data);
    }, (data) => {
      this.logger.error('Coinbase: Pagination Transactions ERROR ' + data.status + '. ' + this.getErrorsAsString(data.error));
      return cb(data.error);
    });
  }

  public sellPrice(token, currency, cb) {

    let url = this.credentials.API + '/v2/prices/sell?currency=' + currency;
    let headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'CB-VERSION': this.credentials.API_VERSION,
      'Authorization': 'Bearer ' + token
    };

    this.http.get(url, { headers }).subscribe((data: any) => {
      this.logger.info('Coinbase: Sell Price SUCCESS');
      return cb(null, data);
    }, (data) => {
      this.logger.error('Coinbase: Sell Price ERROR ' + data.status + '. ' + this.getErrorsAsString(data.error));
      return cb(data.error);
    });
  }

  public buyPrice(token, currency, cb) {
    let url = this.credentials.API + '/v2/prices/buy?currency=' + currency;
    let headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'CB-VERSION': this.credentials.API_VERSION,
      'Authorization': 'Bearer ' + token
    };
    this.http.get(url, { headers }).subscribe((data: any) => {
      this.logger.info('Coinbase: Buy Price: SUCCESS');
      return cb(null, data);
    }, (data) => {
      this.logger.error('Coinbase: Buy Price ERROR ' + data.status + '. ' + this.getErrorsAsString(data.error));
      return cb(data.error);
    });
  }

  public getPaymentMethods(token, cb) {
    let url = this.credentials.API + '/v2/payment-methods';
    let headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'CB-VERSION': this.credentials.API_VERSION,
      'Authorization': 'Bearer ' + token
    };
    this.http.get(url, { headers }).subscribe((data: any) => {
      this.logger.info('Coinbase: Get Payment Methods SUCCESS');
      return cb(null, data);
    }, (data) => {
      this.logger.error('Coinbase: Get Payment Methods ERROR ' + data.status + '. ' + this.getErrorsAsString(data.error));
      return cb(data.error);
    });
  }

  public getPaymentMethod(token, paymentMethodId, cb) {

    let url = this.credentials.API + '/v2/payment-methods/' + paymentMethodId;
    let headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'CB-VERSION': this.credentials.API_VERSION,
      'Authorization': 'Bearer ' + token
    };

    this.http.get(url, { headers }).subscribe((data: any) => {
      this.logger.info('Coinbase: Get Payment Method SUCCESS');
      return cb(null, data);
    }, (data) => {
      this.logger.error('Coinbase: Get Payment Method ERROR ' + data.status + '. ' + this.getErrorsAsString(data.error));
      return cb(data.error);
    });
  }


  public sellRequest(token, accountId, dataSrc, cb) {
    let data = {
      amount: dataSrc.amount,
      currency: dataSrc.currency,
      payment_method: dataSrc.payment_method || null,
      commit: dataSrc.commit || false,
      quote: dataSrc.quote || false
    };
    let url = this.credentials.API + '/v2/accounts/' + accountId + '/sells';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'CB-VERSION': this.credentials.API_VERSION,
      'Authorization': 'Bearer ' + token
    });

    this.http.post(url, data, { headers }).subscribe((data: any) => {
      this.logger.info('Coinbase: Sell Request SUCCESS');
      return cb(null, data);
    }, (data) => {
      this.logger.error('Coinbase: Sell Request ERROR ' + data.status + '. ' + this.getErrorsAsString(data.error));
      return cb(data.error);
    });
  }

  public sellCommit(token, accountId, sellId, cb) {
    let url = this.credentials.API + '/v2/accounts/' + accountId + '/sells/' + sellId + '/commit';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'CB-VERSION': this.credentials.API_VERSION,
      'Authorization': 'Bearer ' + token
    });

    this.http.post(url, null, { headers }).subscribe((data: any) => {
      this.logger.info('Coinbase: Sell Commit SUCCESS');
      return cb(null, data);
    }, (data) => {
      this.logger.error('Coinbase: Sell Commit ERROR ' + data.status + '. ' + this.getErrorsAsString(data.error));
      return cb(data.error);
    });
  }


  public buyRequest(token, accountId, dataSrc, cb) {
    let data = {
      amount: dataSrc.amount,
      currency: dataSrc.currency,
      payment_method: dataSrc.payment_method || null,
      commit: dataSrc.commit || false,
      quote: dataSrc.quote || false
    };
    let url = this.credentials.API + '/v2/accounts/' + accountId + '/buys';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'CB-VERSION': this.credentials.API_VERSION,
      'Authorization': 'Bearer ' + token
    });

    this.http.post(url, data, { headers }).subscribe((data: any) => {
      this.logger.info('Coinbase: Buy Request SUCCESS');
      return cb(null, data);
    }, (data) => {
      this.logger.error('Coinbase: Buy Request ERROR ' + data.status + '. ' + this.getErrorsAsString(data.error));
      return cb(data.error);
    });
  }

  public buyCommit(token, accountId, buyId, cb) {
    let url = this.credentials.API + '/v2/accounts/' + accountId + '/buys/' + buyId + '/commit';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'CB-VERSION': this.credentials.API_VERSION,
      'Authorization': 'Bearer ' + token
    });

    this.http.post(url, null, { headers }).subscribe((data: any) => {
      this.logger.info('Coinbase: Buy Commit SUCCESS');
      return cb(null, data);
    }, (data) => {
      this.logger.error('Coinbase: Buy Commit ERROR ' + data.status + '. ' + this.getErrorsAsString(data.error));
      return cb(data.error);
    });
  }

  public createAddress(token, accountId, dataSrc, cb) {
    let data = {
      name: dataSrc.name
    };
    let url = this.credentials.API + '/v2/accounts/' + accountId + '/addresses';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'CB-VERSION': this.credentials.API_VERSION,
      'Authorization': 'Bearer ' + token
    });

    this.http.post(url, data, { headers }).subscribe((data: any) => {
      this.logger.info('Coinbase: Create Address SUCCESS');
      return cb(null, data);
    }, (data) => {
      this.logger.error('Coinbase: Create Address ERROR ' + data.status + '. ' + this.getErrorsAsString(data.error));
      return cb(data.error);
    });
  }

  public sendTo(token, accountId, dataSrc, cb) {
    let data = {
      type: 'send',
      to: dataSrc.to,
      amount: dataSrc.amount,
      currency: dataSrc.currency,
      description: dataSrc.description
    };
    let url = this.credentials.API + '/v2/accounts/' + accountId + '/transactions';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'CB-VERSION': this.credentials.API_VERSION,
      'Authorization': 'Bearer ' + token
    });

    this.http.post(url, data, { headers }).subscribe((data: any) => {
      this.logger.info('Coinbase: Create Address SUCCESS');
      return cb(null, data);
    }, (data) => {
      this.logger.error('Coinbase: Create Address ERROR ' + data.status + '. ' + this.getErrorsAsString(data.error));
      return cb(data.error);
    });
  }

  // Pending transactions
  public savePendingTransaction(ctx, opts, cb) {
    this._savePendingTransaction(ctx, opts, cb);
  }


  private _savePendingTransaction(ctx, opts, cb) {
    this.persistenceProvider.getCoinbaseTxs(this.credentials.NETWORK).then((oldTxs) => {
      if (_.isString(oldTxs)) {
        oldTxs = JSON.parse(oldTxs);
      }
      if (_.isString(ctx)) {
        ctx = JSON.parse(ctx);
      }
      var tx = oldTxs || {};
      tx[ctx.id] = ctx;
      if (opts && (opts.error || opts.status)) {
        tx[ctx.id] = _.assign(tx[ctx.id], opts);
      }
      if (opts && opts.remove) {
        delete (tx[ctx.id]);
      }
      tx = JSON.stringify(tx);

      this.persistenceProvider.setCoinbaseTxs(this.credentials.NETWORK, tx);
      return cb();
    });
  }

  public getPendingTransactions(coinbasePendingTransactions) {
    this.persistenceProvider.getCoinbaseTxs(this.credentials.NETWORK).then((txs) => {
      txs = txs ? JSON.parse(txs) : {};
      coinbasePendingTransactions.data = _.isEmpty(txs) ? null : txs;

      this.init((err, data) => {
        if (err || _.isEmpty(data)) {
          if (err) this.logger.error(err);
          return;
        }
        var accessToken = data.accessToken;
        var accountId = data.accountId;

        _.forEach(coinbasePendingTransactions.data, (dataFromStorage, txId) => {
          if ((dataFromStorage.type == 'sell' && dataFromStorage.status == 'completed') ||
            (dataFromStorage.type == 'buy' && dataFromStorage.status == 'completed') ||
            dataFromStorage.status == 'error' ||
            (dataFromStorage.type == 'send' && dataFromStorage.status == 'completed'))
            return;
          this.getTransaction(accessToken, accountId, txId, (err, tx) => {
            if (err || _.isEmpty(tx) || (tx.data && tx.data.error)) {
              this._savePendingTransaction(dataFromStorage, {
                status: 'error',
                error: (tx.data && tx.data.error) ? tx.data.error : err
              }, (err) => {
                if (err) this.logger.debug(err);
                this._updateTxs(coinbasePendingTransactions);
              });
              return;
            }
            this._updateCoinbasePendingTransactions(dataFromStorage/* , tx.data */);
            coinbasePendingTransactions.data[txId] = dataFromStorage;
            if (tx.data.type == 'send' && tx.data.status == 'completed' && tx.data.from) {
              this.sellPrice(accessToken, dataFromStorage.sell_price_currency, (err, s) => {
                if (err) {
                  this._savePendingTransaction(dataFromStorage, {
                    status: 'error',
                    error: err
                  }, (err) => {
                    if (err) this.logger.debug(err);
                    this._updateTxs(coinbasePendingTransactions);
                  });
                  return;
                }
                var newSellPrice = s.data.amount;
                var variance = Math.abs((newSellPrice - dataFromStorage.sell_price_amount) / dataFromStorage.sell_price_amount * 100);
                if (variance < dataFromStorage.price_sensitivity.value) {
                  this._sellPending(dataFromStorage, accessToken, accountId, coinbasePendingTransactions);
                } else {
                  this._savePendingTransaction(dataFromStorage, {
                    status: 'error',
                    error: { errors: [{ message: 'Price falls over the selected percentage' }] }
                  }, (err) => {
                    if (err) this.logger.debug(err);
                    this._updateTxs(coinbasePendingTransactions);
                  });
                }
              });
            } else if (tx.data.type == 'buy' && tx.data.status == 'completed' && tx.data.buy) {
              this._sendToWallet(dataFromStorage, accessToken, accountId, coinbasePendingTransactions);
            } else {
              this._savePendingTransaction(dataFromStorage, {}, (err) => {
                if (err) this.logger.debug(err);
                this._updateTxs(coinbasePendingTransactions);
              });
            }
          });
        });
      });
    });
  }

  private _updateCoinbasePendingTransactions(obj /*, …*/) {
    for (var i = 1; i < arguments.length; i++) {
      for (var prop in arguments[i]) {
        var val = arguments[i][prop];
        if (typeof val == "object")
          this._updateCoinbasePendingTransactions(obj[prop]/* , val */);
        else
          obj[prop] = val ? val : obj[prop];
      }
    }
    return obj;
  };

  public updatePendingTransactions = _.throttle(() => {
    this.logger.debug('Updating coinbase pending transactions...');
    var pendingTransactions = {
      data: {}
    };
    this.getPendingTransactions(pendingTransactions);
  }, 20000);

  private _updateTxs(coinbasePendingTransactions) {
    this.persistenceProvider.getCoinbaseTxs(this.credentials.NETWORK).then((txs) => {
      txs = txs ? JSON.parse(txs) : {};
      coinbasePendingTransactions.data = _.isEmpty(txs) ? null : txs;
    });
  }

  private _sellPending(tx, accessToken, accountId, coinbasePendingTransactions) {
    var data = tx.amount;
    data['payment_method'] = tx.payment_method || null;
    data['commit'] = true;
    this.sellRequest(accessToken, accountId, data, (err, res) => {
      if (err) {
        this._savePendingTransaction(tx, {
          status: 'error',
          error: err
        }, (err) => {
          if (err) this.logger.debug(err);
          this._updateTxs(coinbasePendingTransactions);
        });
      } else {
        if (res.data && !res.data.transaction) {
          this._savePendingTransaction(tx, {
            status: 'error',
            error: { errors: [{ message: 'Sell order: transaction not found.' }] }
          }, (err) => {
            if (err) this.logger.debug(err);
            this._updateTxs(coinbasePendingTransactions);
          });
          return;
        }

        this.getTransaction(accessToken, accountId, res.data.transaction.id, (err, updatedTx) => {
          if (err) {
            this._savePendingTransaction(tx, {
              status: 'error',
              error: err
            }, (err) => {
              if (err) this.logger.error(err);
              this._updateTxs(coinbasePendingTransactions);
            });
            return;
          }
          this._savePendingTransaction(tx, {
            remove: true
          }, (err) => {
            this._savePendingTransaction(updatedTx.data, {}, (err) => {
              if (err) this.logger.debug(err);
              this._updateTxs(coinbasePendingTransactions);
            });
          });
        });
      }
    });
  }

  private _sendToWallet(tx, accessToken, accountId, coinbasePendingTransactions) {
    if (!tx) return;
    var desc = this.appProvider.info.nameCase + ' Wallet';
    this._getNetAmount(tx.amount.amount, (err, amountBTC, feeBTC) => {
      if (err) {
        this._savePendingTransaction(tx, {
          status: 'error',
          error: { errors: [{ message: err }] }
        }, (err) => {
          if (err) this.logger.debug(err);
          this._updateTxs(coinbasePendingTransactions);
        });
        return;
      }

      var data = {
        to: tx.toAddr,
        amount: amountBTC,
        currency: tx.amount.currency,
        description: desc,
        fee: feeBTC
      };
      this.sendTo(accessToken, accountId, data, (err, res) => {
        if (err) {
          this._savePendingTransaction(tx, {
            status: 'error',
            error: err
          }, (err) => {
            if (err) this.logger.debug(err);
            this._updateTxs(coinbasePendingTransactions);
          });
        } else {
          if (res.data && !res.data.id) {
            this._savePendingTransaction(tx, {
              status: 'error',
              error: { errors: [{ message: 'Transactions not found in Coinbase.com' }] }
            }, (err) => {
              if (err) this.logger.debug(err);
              this._updateTxs(coinbasePendingTransactions);
            });
            return;
          }
          this.getTransaction(accessToken, accountId, res.data.id, (err, sendTx) => {
            if (err) {
              this._savePendingTransaction(tx, {
                status: 'error',
                error: err
              }, function (err) {
                if (err) this.logger.error(err);
                this._updateTxs(coinbasePendingTransactions);
              });
              return;
            }

            this._savePendingTransaction(tx, {
              remove: true
            }, (err) => {
              if (err) this.logger.error(err);
              this._savePendingTransaction(sendTx.data, {}, (err) => {
                if (err) this.logger.debug(err);
                this._updateTxs(coinbasePendingTransactions);
              });
            });
          });
        }
      });
    });
  }

  public register() {
    this.isActive((isActive) => {
      this.homeIntegrationsProvider.register({
        name: 'coinbase',
        title: 'Coinbase',
        icon: 'assets/img/coinbase/coinbase-icon.png',
        location: '33 Countries',
        page: 'CoinbasePage',
        show: !!this.configProvider.get().showIntegration['coinbase'],
        linked: !!isActive
      });
    });
  }

}
