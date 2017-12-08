
import { Injectable } from '@angular/core';
import { Logger } from '@nsalaun/ng-logger';
import { HttpClient } from '@angular/common/http';

//providers
import { PlatformProvider } from '../platform/platform';
import { PersistenceProvider } from '../persistence/persistence';
import { BuyAndSellProvider } from '../buy-and-sell/buy-and-sell';

import * as _ from 'lodash';

@Injectable()
export class GlideraProvider {

  private credentials: any;
  private isCordova: boolean;

  constructor(
    private logger: Logger,
    private http: HttpClient,
    private platformProvider: PlatformProvider,
    private persistenceProvider: PersistenceProvider,
    private buyAndSellProvider: BuyAndSellProvider
  ) {
    this.logger.info('GlideraProvider initialized.');

    this.credentials = {};
    this.isCordova = this.platformProvider.isCordova;
    this.setCredentials();
    this.register();
  }

  private setCredentials() {
    if (!(window as any).externalServices || !(window as any).externalServices.glidera) {
      return;
    }

    var glidera = (window as any).externalServices.glidera;

    /*
     * Development: 'testnet'
     * Production: 'livenet'
     */
    this.credentials.NETWORK = 'livenet';
    //this.credentials.NETWORK = 'testnet';

    if (this.credentials.NETWORK == 'testnet') {
      this.credentials.HOST = glidera.sandbox.host;
      if (this.isCordova) {
        this.credentials.REDIRECT_URI = glidera.sandbox.mobile.redirect_uri;
        this.credentials.CLIENT_ID = glidera.sandbox.mobile.client_id;
        this.credentials.CLIENT_SECRET = glidera.sandbox.mobile.client_secret;
      } else {
        this.credentials.REDIRECT_URI = glidera.sandbox.desktop.redirect_uri;
        this.credentials.CLIENT_ID = glidera.sandbox.desktop.client_id;
        this.credentials.CLIENT_SECRET = glidera.sandbox.desktop.client_secret;
      }
    } else {
      this.credentials.HOST = glidera.production.host;
      if (this.isCordova) {
        this.credentials.REDIRECT_URI = glidera.production.mobile.redirect_uri;
        this.credentials.CLIENT_ID = glidera.production.mobile.client_id;
        this.credentials.CLIENT_SECRET = glidera.production.mobile.client_secret;
      } else {
        this.credentials.REDIRECT_URI = glidera.production.desktop.redirect_uri;
        this.credentials.CLIENT_ID = glidera.production.desktop.client_id;
        this.credentials.CLIENT_SECRET = glidera.production.desktop.client_secret;
      }
    };
  }

  public getNetwork() {
    return this.credentials.NETWORK;
  }

  public getCurrency() {
    return 'USD';
  }

  public getSignupUrl() {
    return this.credentials.HOST + '/register';
  }

  public getSupportUrl() {
    return 'https://twitter.com/GlideraInc';
  }

  public getOauthCodeUrl() {
    return this.credentials.HOST + '/oauth2/auth?response_type=code&client_id=' + this.credentials.CLIENT_ID + '&redirect_uri=' + this.credentials.REDIRECT_URI;
  }

  public remove() {
    this.persistenceProvider.removeGlideraToken(this.credentials.NETWORK);
    this.persistenceProvider.removeGlideraPermissions(this.credentials.NETWORK);
    this.persistenceProvider.removeGlideraStatus(this.credentials.NETWORK);
    this.persistenceProvider.removeGlideraTxs(this.credentials.NETWORK);
    this.buyAndSellProvider.updateLink('glidera', false);
  }

  public getToken(code, cb) {
    let url = this.credentials.HOST + '/api/v1/oauth/token';
    let data = {
      grant_type: 'authorization_code',
      code: code,
      client_id: this.credentials.CLIENT_ID,
      client_secret: this.credentials.CLIENT_SECRET,
      redirect_uri: this.credentials.REDIRECT_URI
    };
    let headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    this.http.post(url, data, headers).subscribe((data: any) => {
      this.logger.info('Glidera Authorization Access Token: SUCCESS');
      return cb(null, data.data);
    }, (data) => {
      this.logger.error('Glidera Authorization Access Token: ERROR ' + data.statusText);
      var message = data.data && data.data.message ? data.data.message : data.statusText;
      return cb(message);
    });
  }

  public authorize(code, cb) {
    this.getToken(code, (err, data) => {
      if (err) return cb(err);
      if (data && !data.access_token) return cb('No access token');
      var accessToken = data.access_token;
      this.getAccessTokenPermissions(accessToken, (err, p) => {
        if (err) return cb(err);
        this.getStatus(accessToken, (err, status) => {
          if (err) this.logger.error(err);
          this.persistenceProvider.setGlideraToken(this.credentials.NETWORK, accessToken);
          this.persistenceProvider.setGlideraPermissions(this.credentials.NETWORK, JSON.stringify(p));
          this.persistenceProvider.setGlideraStatus(this.credentials.NETWORK, JSON.stringify(status));
          return cb(null, {
            token: accessToken,
            permissions: p,
            status: status
          });
        });
      });
    });
  }

  public getAccessTokenPermissions(token, cb) {
    if (!token) return cb('Invalid Token');

    let url = this.credentials.HOST + '/api/v1/oauth/token';
    let headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + token
    };

    this.http.get(url, headers).subscribe((data: any) => {
      this.logger.info('Glidera Access Token Permissions: SUCCESS');
      return cb(null, data.data);
    }, (data) => {
      var message = data.data && data.data.message ? data.data.message : data.statusText;
      this.logger.error('Glidera Access Token Permissions: ERROR ' + message);
      return cb(message);
    });
  };

  public getEmail(token, cb) {
    if (!token) return cb('Invalid Token');
    let url = this.credentials.HOST + '/api/v1/user/email';
    let headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + token
    };

    this.http.get(url, headers).subscribe((data: any) => {
      this.logger.info('Glidera Get Email: SUCCESS');
      return cb(null, data.data);
    }, (data) => {
      this.logger.error('Glidera Get Email: ERROR ' + data.statusText);
      var message = data.data && data.data.message ? data.data.message : data.statusText;
      return cb(message);
    });
  }

  public getPersonalInfo(token, cb) {
    if (!token) return cb('Invalid Token');
    let url = this.credentials.HOST + '/api/v1/user/personalinfo';
    let headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + token
    };

    this.http.get(url, headers).subscribe((data: any) => {
      this.logger.info('Glidera Get Personal Info: SUCCESS');
      return cb(null, data.data);
    }, (data) => {
      this.logger.error('Glidera Get Personal Info: ERROR ' + data.statusText);
      var message = data.data && data.data.message ? data.data.message : data.statusText;
      return cb(message);
    });
  }

  public getStatus(token, cb) {
    if (!token) return cb('Invalid Token');
    let url = this.credentials.HOST + '/api/v1/user/status';
    let headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + token
    };

    this.http.get(url, headers).subscribe((data: any) => {
      this.logger.info('Glidera User Status: SUCCESS');
      return cb(null, data.data);
    }, (data) => {
      this.logger.error('Glidera User Status: ERROR ' + data.statusText);
      var message = data.data && data.data.message ? data.data.message : data.statusText;
      return cb(message);
    });
  }

  public getLimits(token, cb) {
    if (!token) return cb('Invalid Token');
    let url = this.credentials.HOST + '/api/v1/user/limits';
    let headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + token
    };

    this.http.get(url, headers).subscribe((data: any) => {
      this.logger.info('Glidera Transaction Limits: SUCCESS');
      return cb(null, data.data);
    }, (data) => {
      this.logger.error('Glidera Transaction Limits: ERROR ' + data.statusText);
      var message = data.data && data.data.message ? data.data.message : data.statusText;
      return cb(message);
    });
  }

  public getTransactions(token, cb) {
    if (!token) return cb('Invalid Token');

    let url = this.credentials.HOST + '/api/v1/transaction';
    let headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + token
    };

    this.http.get(url, headers).subscribe((data: any) => {
      this.logger.info('Glidera Transactions: SUCCESS');
      return cb(null, data.data.transactions);
    }, (data) => {
      this.logger.error('Glidera Transactions: ERROR ' + data.statusText);
      var message = data.data && data.data.message ? data.data.message : data.statusText;
      return cb(message);
    });
  }

  public getTransaction(token, txid, cb) {
    if (!token) return cb('Invalid Token');
    if (!txid) return cb('TxId required');

    let url = this.credentials.HOST + '/api/v1/transaction/' + txid;
    let headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + token
    };

    this.http.get(url, headers).subscribe((data: any) => {
      this.logger.info('Glidera Transaction: SUCCESS');
      return cb(null, data.data);
    }, (data) => {
      this.logger.error('Glidera Transaction: ERROR ' + data.statusText);
      var message = data.data && data.data.message ? data.data.message : data.statusText;
      return cb(message);
    });
  }


  public getSellAddress(token, cb) {
    if (!token) return cb('Invalid Token');

    let url = this.credentials.HOST + '/api/v1/user/create_sell_address';
    let headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + token
    };

    this.http.get(url, headers).subscribe((data: any) => {
      this.logger.info('Glidera Create Sell Address: SUCCESS');
      return cb(null, data.data.sellAddress);
    }, (data) => {
      this.logger.error('Glidera Create Sell Address: ERROR ' + data.statusText);
      var message = data.data && data.data.message ? data.data.message : data.statusText;
      return cb(message);
    });
  }

  public get2faCode(token, cb) {
    if (!token) return cb('Invalid Token');
    let url = this.credentials.HOST + '/api/v1/authentication/get2faCode';
    let headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + token
    };
    this.http.get(url, headers).subscribe((data: any) => {
      this.logger.info('Glidera 2FA code: SUCCESS');
      return cb(null, data.data);
    }, (data) => {
      this.logger.error('Glidera 2FA code: ERROR ' + data.statusText);
      var message = data.data && data.data.message ? data.data.message : data.statusText;
      return cb(message);
    });
  }

  public sellPrice(token, price, cb) {
    let data = {
      qty: price.qty,
      fiat: price.fiat
    };
    let url = this.credentials.HOST + '/api/v1/prices/sell';
    let headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + token,
      'X-2FA-CODE': null
    };

    this.http.post(url, data, headers).subscribe((data: any) => {
      this.logger.info('Glidera Sell Price: SUCCESS');
      return cb(null, data.data);
    }, (data) => {
      this.logger.error('Glidera Sell Price: ERROR ' + data.statusText);
      var message = data.data && data.data.message ? data.data.message : data.statusText;
      return cb(message);
    });
  }

  public sell(token, twoFaCode, dataSrc, cb) {
    let data = {
      refundAddress: dataSrc.refundAddress,
      signedTransaction: dataSrc.signedTransaction,
      priceUuid: dataSrc.priceUuid,
      useCurrentPrice: dataSrc.useCurrentPrice,
      ip: dataSrc.ip
    };
    let url = this.credentials.HOST + '/api/v1/sell';
    let headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + token,
      'X-2FA-CODE': twoFaCode
    };

    this.http.post(url, data, headers).subscribe((data: any) => {
      this.logger.info('Glidera Sell: SUCCESS');
      return cb(null, data.data);
    }, (data) => {
      this.logger.error('Glidera Sell Request: ERROR ' + data.statusText);
      var message = data.data && data.data.message ? data.data.message : data.statusText;
      return cb(message);
    });
  }

  public buyPrice(token, price, cb) {
    let data = {
      qty: price.qty,
      fiat: price.fiat
    };
    let url = this.credentials.HOST + '/api/v1/prices/buy';
    let headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + token,
      'X-2FA-CODE': null
    };

    this.http.post(url, data, headers).subscribe((data: any) => {
      this.logger.info('Glidera Buy Price: SUCCESS');
      return cb(null, data.data);
    }, (data) => {
      this.logger.error('Glidera Buy Price: ERROR ' + data.statusText);
      var message = data.data && data.data.message ? data.data.message : data.statusText;
      return cb(message);
    });
  }

  public buy(token, twoFaCode, dataSrc, cb) {
    let data = {
      destinationAddress: dataSrc.destinationAddress,
      qty: dataSrc.qty,
      priceUuid: dataSrc.priceUuid,
      useCurrentPrice: dataSrc.useCurrentPrice,
      ip: dataSrc.ip
    };

    let url = this.credentials.HOST + '/api/v1/buy';
    let headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + token,
      'X-2FA-CODE': twoFaCode
    };

    this.http.post(url, data, headers).subscribe((data: any) => {
      this.logger.info('Glidera Buy: SUCCESS');
      return cb(null, data.data);
    }, (data) => {
      this.logger.error('Glidera Buy Request: ERROR ' + data.statusText);
      var message = data.data && data.data.message ? data.data.message : data.statusText;
      return cb(message);
    });
  }

  private getPermissions(accessToken, network, force, cb) {
    this.persistenceProvider.getGlideraPermissions(network).then((permissions) => {
      if (_.isString(permissions)) permissions = JSON.parse(permissions);
      if (force || _.isEmpty(permissions)) {
        this.getAccessTokenPermissions(accessToken, (err, p) => {
          if (err) {
            // Return error and remove token
            this.remove();
            return cb(null);
          } else {
            // Return permissions and store
            this.persistenceProvider.setGlideraPermissions(network, JSON.stringify(p));
            return cb(null, p);
          }
        });
      } else {
        return cb(null, permissions);
      }
    });
  }

  public init(cb) {
    if (_.isEmpty(this.credentials.CLIENT_ID)) {
      return cb('Glidera is Disabled');
    }
    this.logger.debug('Trying to initialise Glidera...');

    this.persistenceProvider.getGlideraToken(this.credentials.NETWORK).then((accessToken) => {
      if (_.isEmpty(accessToken)) return cb();

      this.getPermissions(accessToken, this.credentials.NETWORK, true, (err, permissions) => {
        if (err) return cb(err);

        this.persistenceProvider.getGlideraStatus(this.credentials.NETWORK).then((status) => {
          if (_.isString(status)) status = JSON.parse(status);
          this.persistenceProvider.getGlideraTxs(this.credentials.NETWORK).then((txs) => {
            if (_.isString(txs)) txs = JSON.parse(txs);
            this.buyAndSellProvider.updateLink('glidera', true);
            return cb(null, {
              token: accessToken,
              permissions: permissions,
              status: status,
              txs: txs
            });
          });
        });
      });
    });
  }

  public updateStatus(data) {
    this.persistenceProvider.getGlideraToken(this.credentials.NETWORK).then((accessToken) => {
      this.getPermissions(accessToken, this.credentials.NETWORK, false, (err, permissions) => {
        if (err) return;
        data.permissions = permissions;

        data.price = {};
        this.buyPrice(accessToken, {
          qty: 1
        }, (err, buy) => {
          if (err) return;
          data.price['buy'] = buy.price;
        });
        this.sellPrice(accessToken, {
          qty: 1
        }, (err, sell) => {
          if (err) return;
          data.price['sell'] = sell.price;
        });

        this.getStatus(accessToken, (err, status) => {
          if (err) return;
          data.status = status;
          this.persistenceProvider.setGlideraStatus(this.credentials.NETWORK, JSON.stringify(status));
        });

        this.getLimits(accessToken, (err, limits) => {
          data.limits = limits;
        });

        if (permissions.transaction_history) {
          this.getTransactions(accessToken, (err, txs) => {
            if (err) return;
            this.persistenceProvider.setGlideraTxs(this.credentials.NETWORK, JSON.stringify(txs));
            data.txs = txs;
          });
        }

        if (permissions.view_email_address) {
          this.getEmail(accessToken, (err, email) => {
            if (err) return;
            data.email = email;
          });
        }
        if (permissions.personal_info) {
          this.getPersonalInfo(accessToken, (err, info) => {
            if (err) return;
            data.personalInfo = info;
          });
        }
      });
    });
  }

  private register() {
    this.persistenceProvider.getGlideraToken(this.credentials.NETWORK).then((token) => {
      this.buyAndSellProvider.register({
        name: 'glidera',
        logo: 'img/glidera-logo.png',
        location: 'US Only',
        sref: 'tabs.buyandsell.glidera',
        configSref: 'tabs.preferences.glidera',
        linked: !!token,
      });
    });
  }

}