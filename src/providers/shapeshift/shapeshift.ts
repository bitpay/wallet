import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';
import * as _ from 'lodash';

//providers
import { AppProvider } from '../app/app';
import { HomeIntegrationsProvider } from '../home-integrations/home-integrations';
import { NextStepsProvider } from '../next-steps/next-steps';
import { PersistenceProvider } from '../persistence/persistence';

@Injectable()
export class ShapeshiftProvider {

  private credentials: any;
  private homeItem: any;

  constructor(
    private appProvider: AppProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private http: HttpClient,
    private logger: Logger,
    private nextStepsProvider: NextStepsProvider,
    private persistenceProvider: PersistenceProvider
  ) {
    this.logger.info('Hello ShapeshiftProvider Provider');
    this.credentials = {};

    // (Optional) Affiliate PUBLIC KEY, for volume tracking, affiliate payments, split-shifts, etc.
    if (this.appProvider.servicesInfo && this.appProvider.servicesInfo.shapeshift) {
      this.credentials.API_KEY = this.appProvider.servicesInfo.shapeshift.api_key || null;
    }

    /*
    * Development: 'testnet'
    * Production: 'livenet'
    */
    this.credentials.NETWORK = 'livenet';
    //credentials.NETWORK = 'testnet';

    if (this.credentials.NETWORK == 'testnet') {
      this.credentials.API_URL = "";
    } else {
      // CORS: cors.shapeshift.io
      this.credentials.API_URL = "https://shapeshift.io";
    }

    this.homeItem = {
      name: 'shapeshift',
      title: 'ShapeShift',
      icon: 'assets/img/shapeshift/icon-shapeshift.svg',
      page: 'ShapeshiftPage',
    };
  }

  public getNetwork() {
    return this.credentials.NETWORK;
  }

  public shift(data: any, cb): any {

    let dataSrc = {
      withdrawal: data.withdrawal,
      pair: data.pair,
      returnAddress: data.returnAddress,
      apiKey: this.credentials.API_KEY
    };

    this.http.post(this.credentials.API_URL + '/shift', dataSrc).subscribe((data: any) => {
      this.logger.info('Shapeshift SHIFT: SUCCESS');
      return cb(null, data);
    }, (data) => {
      this.logger.error('Shapeshift SHIFT ERROR: ' + data.error.message);
      return cb(data);
    });
  }

  public saveShapeshift(data: any, opts: any, cb): void {
    let network = this.getNetwork();
    this.persistenceProvider.getShapeshift(network).then((oldData: any) => {
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
        delete (inv[data.address]);
      }

      inv = JSON.stringify(inv);

      this.persistenceProvider.setShapeshift(network, inv);
      this.homeIntegrationsProvider.register(this.homeItem);
      this.nextStepsProvider.unregister(this.homeItem.name);
      return cb(null);
    }).catch((err: any) => {
      return cb(err);
    });
  }

  public getShapeshift(cb) {
    let network = this.getNetwork();
    this.persistenceProvider.getShapeshift(network).then((ss: any) => {
      return cb(null, ss);
    }).catch((err: any) => {
      return cb(err, null);
    });
  }

  public getRate(pair: string, cb) {
    this.http.get(this.credentials.API_URL + '/rate/' + pair).subscribe((data: any) => {
      this.logger.info('Shapeshift PAIR: SUCCESS');
      return cb(null, data);
    }, (data: any) => {
      this.logger.error('Shapeshift PAIR ERROR: ' + data.error.message);
      return cb(data);
    });
  }

  public getLimit(pair: string, cb) {
    this.http.get(this.credentials.API_URL + '/limit/' + pair).subscribe((data: any) => {
      this.logger.info('Shapeshift LIMIT: SUCCESS');
      return cb(null, data);
    }, (data: any) => {
      this.logger.error('Shapeshift LIMIT ERROR: ' + data.error.message);
      return cb(data);
    });
  }

  public getMarketInfo(pair: string, cb) {
    this.http.get(this.credentials.API_URL + '/marketinfo/' + pair).subscribe((data: any) => {
      this.logger.info('Shapeshift MARKET INFO: SUCCESS');
      return cb(null, data);
    }, (data: any) => {
      this.logger.error('Shapeshift MARKET INFO ERROR', data.error.message);
      return cb(data);
    });
  }

  public getStatus(addr: string, cb) {
    this.http.get(this.credentials.API_URL + '/txStat/' + addr).subscribe((data: any) => {
      this.logger.info('Shapeshift STATUS: SUCCESS');
      return cb(null, data);
    }, (data: any) => {
      this.logger.error('Shapeshift STATUS ERROR: ' + data.error.message);
      return cb(data);
    });
  }

  public register(): void {
    this.persistenceProvider.getShapeshift(this.getNetwork()).then((ss: any) => {
      if (ss) {
        this.homeIntegrationsProvider.register(this.homeItem);
      } else {
        this.nextStepsProvider.register(this.homeItem);
      }
    });
  }

}
