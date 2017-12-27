import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Logger } from '@nsalaun/ng-logger';
import * as _ from 'lodash';

//providers
import { HomeIntegrationsProvider } from '../home-integrations/home-integrations';
import { PersistenceProvider } from '../persistence/persistence';
import { NextStepsProvider } from '../next-steps/next-steps';

@Injectable()
export class ShapeshiftProvider {

  private credentials: any;
  private homeItem: any;

  constructor(
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private http: HttpClient,
    private logger: Logger,
    private persistenceProvider: PersistenceProvider,
    private nextStepsProvider: NextStepsProvider
  ) {
    this.logger.info('Hello ShapeshiftProvider Provider');
    this.credentials = {};
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
      this.credentials.API_URL = "https://cors.shapeshift.io";
    };

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
      returnAddress: data.returnAddress
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
    var network = this.getNetwork();
    this.persistenceProvider.getShapeshift(network).then((ss: any) => {
      var _gcds = ss ? JSON.parse(ss) : null;
      return cb(null, _gcds);
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
