import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { Logger } from '../../providers/logger/logger';

// providers
import { AppProvider } from '../app/app';
import { ConfigProvider } from '../config/config';
import { HomeIntegrationsProvider } from '../home-integrations/home-integrations';
import { PersistenceProvider } from '../persistence/persistence';

@Injectable()
export class ShapeshiftProvider {
  private credentials;

  constructor(
    private appProvider: AppProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private http: HttpClient,
    private logger: Logger,
    private configProvider: ConfigProvider,
    private persistenceProvider: PersistenceProvider
  ) {
    this.logger.debug('ShapeshiftProvider Provider initialized');
    this.credentials = {};
  }

  public setCredentials() {
    // (Mandatory) Affiliate PUBLIC KEY, for volume tracking, affiliate payments, split-shifts, etc.
    if (
      !this.appProvider.servicesInfo ||
      !this.appProvider.servicesInfo.shapeshift
    ) {
      return;
    }
    var shapeshift = this.appProvider.servicesInfo.shapeshift;

    /*
    * Development: 'testnet'
    * Production: 'livenet'
    */
    this.credentials.NETWORK = 'livenet';
    this.credentials.API_URL =
      this.credentials.NETWORK === 'testnet'
        ? ''
        : // CORS: cors.shapeshift.io
          'https://shapeshift.io';

    this.credentials.REDIRECT_URI = shapeshift.production.redirect_uri;
    this.credentials.HOST = shapeshift.production.host;
    this.credentials.API = shapeshift.production.api;
    this.credentials.CLIENT_ID = shapeshift.production.client_id;
    this.credentials.CLIENT_SECRET = shapeshift.production.client_secret;
    this.credentials.API_KEY = shapeshift.api_key || null;
  }

  public getNetwork() {
    return this.credentials.NETWORK;
  }

  public shift(data, cb) {
    let dataSrc = {
      withdrawal: data.withdrawal,
      pair: data.pair,
      returnAddress: data.returnAddress,
      apiKey: this.credentials.API_KEY
    };

    let url = this.credentials.API_URL + '/shift';
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: 'Bearer ' + data.token
    });

    this.http.post(url, dataSrc, { headers }).subscribe(
      data => {
        this.logger.info('Shapeshift SHIFT: SUCCESS');
        return cb(null, data);
      },
      data => {
        this.logger.error('Shapeshift SHIFT ERROR: ' + data.error.message);
        return cb(data.error.message);
      }
    );
  }

  public saveShapeshift(data, opts, cb): void {
    let network = this.getNetwork();
    this.persistenceProvider
      .getShapeshift(network)
      .then(oldData => {
        if (_.isString(oldData)) {
          oldData = JSON.parse(oldData);
        }
        if (_.isString(data)) {
          data = JSON.parse(data);
        }
        let inv = oldData ? oldData : {};
        inv[data.address] = data;
        if (opts && (opts.error || opts.status)) {
          inv[data.address] = _.assign(inv[data.address], opts);
        }
        if (opts && opts.remove) {
          delete inv[data.address];
        }

        inv = JSON.stringify(inv);

        this.persistenceProvider.setShapeshift(network, inv);
        return cb(null);
      })
      .catch(err => {
        return cb(err);
      });
  }

  public getShapeshift(cb) {
    let network = this.getNetwork();
    this.persistenceProvider
      .getShapeshift(network)
      .then(ss => {
        return cb(null, ss);
      })
      .catch(err => {
        return cb(err, null);
      });
  }

  public getRate(pair: string, cb) {
    this.http.get(this.credentials.API_URL + '/rate/' + pair).subscribe(
      data => {
        this.logger.info('Shapeshift PAIR: SUCCESS');
        return cb(null, data);
      },
      data => {
        this.logger.error('Shapeshift PAIR ERROR: ' + data.error.message);
        return cb(data);
      }
    );
  }

  public getLimit(pair: string, cb) {
    this.http.get(this.credentials.API_URL + '/limit/' + pair).subscribe(
      data => {
        this.logger.info('Shapeshift LIMIT: SUCCESS');
        return cb(null, data);
      },
      data => {
        this.logger.error('Shapeshift LIMIT ERROR: ' + data.error.message);
        return cb(data);
      }
    );
  }

  public getMarketInfo(pair: string, cb) {
    this.http.get(this.credentials.API_URL + '/marketinfo/' + pair).subscribe(
      data => {
        this.logger.info('Shapeshift MARKET INFO: SUCCESS');
        return cb(null, data);
      },
      data => {
        this.logger.error('Shapeshift MARKET INFO ERROR', data.error.message);
        return cb(data);
      }
    );
  }

  public getStatus(addr: string, token: string, cb) {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: 'Bearer ' + token
    });
    this.http
      .get(this.credentials.API_URL + '/txStat/' + addr, { headers })
      .subscribe(
        data => {
          this.logger.info('Shapeshift STATUS: SUCCESS');
          return cb(null, data);
        },
        data => {
          this.logger.error('Shapeshift STATUS ERROR: ' + data.error.message);
          return cb(data);
        }
      );
  }

  public register(): void {
    this.homeIntegrationsProvider.register({
      name: 'shapeshift',
      title: 'ShapeShift',
      icon: 'assets/img/shapeshift/icon-shapeshift.svg',
      page: 'ShapeshiftPage',
      show: !!this.configProvider.get().showIntegration['shapeshift']
    });
  }

  public getOauthCodeUrl() {
    return (
      this.credentials.HOST +
      '/oauth/authorize?response_type=code&scope=users:read&client_id=' +
      this.credentials.CLIENT_ID +
      '&redirect_uri=' +
      this.credentials.REDIRECT_URI
    );
  }

  public getSignupUrl() {
    return this.credentials.HOST + '/signup';
  }

  public getStoredToken(cb) {
    this.persistenceProvider
      .getShapeshiftToken(this.credentials.NETWORK)
      .then(accessToken => {
        if (!accessToken) return cb();
        return cb(accessToken);
      })
      .catch(_ => {
        return cb();
      });
  }

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
      Accept: 'application/json'
    });

    this.http.post(url, data, { headers }).subscribe(
      data => {
        this.logger.info('ShapeShift: GET Access Token: SUCCESS');
        // Show pending task from the UI
        this._afterTokenReceived(data, cb);
      },
      data => {
        this.logger.error(
          'ShapeShift: GET Access Token: ERROR ' +
            data.status +
            '. ' +
            this.getErrorsAsString(data.error)
        );
        return cb(data.error);
      }
    );
  }

  private _afterTokenReceived(data, cb) {
    if (data && data.access_token && data.refresh_token) {
      this.persistenceProvider.setShapeshiftToken(
        this.credentials.NETWORK,
        data.access_token
      );
      this.persistenceProvider.setShapeshiftRefreshToken(
        this.credentials.NETWORK,
        data.refresh_token
      );
      this.homeIntegrationsProvider.updateLink('shapeshift', data.access_token); // Name, Token
      return cb(null, data.access_token);
    } else {
      return cb('Could not get the access token');
    }
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
      Accept: 'application/json'
    });

    this.http.post(url, data, { headers }).subscribe(
      data => {
        this.logger.info('ShapeShift: Refresh Access Token SUCCESS');
        this._afterTokenReceived(data, cb);
      },
      data => {
        this.logger.error(
          'ShapeShift: Refresh Access Token ERROR ' +
            data.status +
            '. ' +
            this.getErrorsAsString(data.error)
        );
        return cb(data.error);
      }
    );
  }

  public getErrorsAsString(data): string {
    let errData;

    try {
      if (data && data.errors) errData = data.errors;
      else if (data && data.error) errData = data.error_description;
      else return JSON.stringify(data);

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
      return e;
    }
  }

  public init = _.throttle(cb => {
    if (_.isEmpty(this.credentials.CLIENT_ID)) {
      return cb('ShapeShift is Disabled. Missing credentials.');
    }
    this.logger.debug('Trying to initialize ShapeShift...');

    this.getStoredToken(accessToken => {
      if (!accessToken) {
        this.logger.debug('ShapeShift not linked');
        return cb();
      }
      this.logger.debug('ShapeShift already has Token.');
      this._getMainAccountId(accessToken, (err, accountId) => {
        if (err) {
          if (!err.errors) return cb(err);
          if (err.errors && !_.isArray(err.errors)) return cb(err);

          let expiredToken;
          for (let i = 0; i < err.errors.length; i++) {
            if (err.errors[i].id == 'expired_token') expiredToken = true;
          }

          if (expiredToken) {
            this.logger.debug('Token Expired. Refresh and get new Token.');
            this.persistenceProvider
              .getShapeshiftRefreshToken(this.credentials.NETWORK)
              .then(refreshToken => {
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
              })
              .catch(err => {
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
    });
  }, 10000);

  private _getMainAccountId(accessToken, cb) {
    this.getAccount(accessToken, (err, a) => {
      if (err) {
        this.logout();
        return cb(err);
      }
      if (a.data.verificationStatus != 'NONE') {
        return cb(null, a.data.id);
      }
      return cb('Your account is not verified');
    });
  }

  public getAccount(token, cb) {
    if (!token) return cb('Invalid Token');

    let url = this.credentials.HOST + '/api/v1/users/me';
    let headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: 'Bearer ' + token
    };

    this.http.get(url, { headers }).subscribe(
      data => {
        this.logger.info('ShapeShift: Get Account SUCCESS');
        return cb(null, data);
      },
      data => {
        this.logger.error(
          'ShapeShift: Get Account ERROR ' +
            data.status +
            '. ' +
            this.getErrorsAsString(data.error)
        );
        return cb(data.error);
      }
    );
  }

  public logout() {
    this.persistenceProvider.removeShapeshiftToken(this.credentials.NETWORK);
    this.persistenceProvider.removeShapeshiftRefreshToken(
      this.credentials.NETWORK
    );
    this.homeIntegrationsProvider.updateLink('shapeshift', null); // Name, Token
  }
}
