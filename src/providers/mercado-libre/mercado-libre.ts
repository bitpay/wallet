import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';
import { HttpClient } from '@angular/common/http';

//providers
import { PersistenceProvider } from '../persistence/persistence';
import { HomeIntegrationsProvider } from '../home-integrations/home-integrations';
import { NextStepsProvider } from '../next-steps/next-steps';

import * as _ from 'lodash';

@Injectable()
export class MercadoLibreProvider {

  private credentials: any;
  //private availableCountries: any;
  private homeItem: any;
  private nextStepItem: any;

  constructor(
    private persistenceProvider: PersistenceProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private nextStepsProvider: NextStepsProvider,
    private http: HttpClient,
    private logger: Logger
  ) {
    this.logger.info('MercadoLibreProvider initialized');
    // Not used yet
    /* this.availableCountries = [{
      'country': 'Brazil',
      'currency': 'BRL',
      'name': 'Mercado Livre',
      'url': 'https://www.mercadolivre.com.br'
    }]; */

    /*
    * Development: 'testnet'
    * Production: 'livenet'
    */
    this.credentials = {};
    this.credentials.NETWORK = 'livenet';
    //this.credentials.NETWORK = 'testnet';
    if (this.credentials.NETWORK == 'testnet') {
      this.credentials.BITPAY_API_URL = "https://test.bitpay.com";
    } else {
      this.credentials.BITPAY_API_URL = "https://bitpay.com";
    }

    this.homeItem = {
      name: 'mercadoLibre',
      title: 'Mercado Livre Brazil Gift Cards',
      icon: 'assets/img/mercado-libre/icon-ml.svg',
      page: 'MercadoLibrePage',
    };

    this.nextStepItem = {
      name: 'mercadoLibre',
      title: 'Buy Mercado Livre Brazil Gift Cards',
      icon: 'assets/img/mercado-libre/icon-ml.svg',
      page: 'MercadoLibrePage',
    };
  }

  public getNetwork() {
    return this.credentials.NETWORK;
  }

  public savePendingGiftCard(gc, opts, cb) {
    var network = this.getNetwork();
    this.persistenceProvider.getMercadoLibreGiftCards(network).then((oldGiftCards) => {
      if (_.isString(oldGiftCards)) {
        oldGiftCards = oldGiftCards;
      }
      if (_.isString(gc)) {
        gc = JSON.parse(gc);
      }
      var inv = oldGiftCards || {};
      inv[gc.invoiceId] = gc;
      if (opts && (opts.error || opts.status)) {
        inv[gc.invoiceId] = _.assign(inv[gc.invoiceId], opts);
      }
      if (opts && opts.remove) {
        delete (inv[gc.invoiceId]);
      }

      inv = JSON.stringify(inv);


      this.persistenceProvider.setMercadoLibreGiftCards(network, inv);

      this.homeIntegrationsProvider.register(this.homeItem);
      this.nextStepsProvider.unregister(this.nextStepItem.name);
      return cb();
    });
  }

  public getPendingGiftCards(cb) {
    var network = this.getNetwork();
    this.persistenceProvider.getMercadoLibreGiftCards(network).then((giftCards) => {
      var _gcds = giftCards ? giftCards : null;
      return cb(null, _gcds);
    });
  }

  public createBitPayInvoice(data, cb) {
    let dataSrc = {
      currency: data.currency,
      amount: data.amount,
      clientId: data.uuid,
      email: data.email
    };
    let url = this.credentials.BITPAY_API_URL + '/mercado-libre-gift/pay';
    let headers: any = {
      'content-type': 'application/json'
    };
    this.http.post(url, dataSrc, headers).subscribe((data: any) => {
      this.logger.info('BitPay Create Invoice: SUCCESS');
      return cb(null, data);
    }, (data) => {
      this.logger.error('BitPay Create Invoice: ERROR', JSON.stringify(data));
      return cb(data);
    });
  }

  public getBitPayInvoice(id, cb) {
    let url = this.credentials.BITPAY_API_URL + '/invoices/' + id;
    let headers: any = {
      'content-type': 'application/json'
    };

    this.http.get(url, headers).subscribe((data: any) => {
      this.logger.info('BitPay Get Invoice: SUCCESS');
      return cb(null, data.data);
    }, (data) => {
      this.logger.error('BitPay Get Invoice: ERROR', JSON.stringify(data));
      return cb(data);
    });
  }

  public createGiftCard(data, cb) {
    var dataSrc = {
      "clientId": data.uuid,
      "invoiceId": data.invoiceId,
      "accessKey": data.accessKey
    };

    let url = this.credentials.BITPAY_API_URL + '/mercado-libre-gift/redeem';
    let headers: any = {
      'content-type': 'application/json'
    };

    this.http.post(url, dataSrc, headers).subscribe((data: any) => {
      var status = data.status == 'new' ? 'PENDING' : (data.status == 'paid') ? 'PENDING' : data.status;
      data.status = status;
      this.logger.info('Mercado Libre Gift Card Create/Update: ' + status);
      return cb(null, data);
    }, (data) => {
      this.logger.error('Mercado Libre Gift Card Create/Update: ERROR', JSON.stringify(data));
      return cb(data);
    });
  }

  /*
 * Disabled for now *
 */
  /*
  public cancelGiftCard(data, cb) {

    var dataSrc = {
      "clientId": data.uuid,
      "invoiceId": data.invoiceId,
      "accessKey": data.accessKey
    };
    let url = this.credentials.BITPAY_API_URL + '/mercado-libre-gift/cancel';
    let headers: any = {
      'content-type': 'application/json'
    };
    this.http.post(url, dataSrc, headers).subscribe((data: any) => {
      this.logger.info('Mercado Libre Gift Card Cancel: SUCCESS');
      return cb(null, data);
    }, (data) => {
      this.logger.error('Mercado Libre Gift Card Cancel: ' + data.message);
      return cb(data);
    });
  };
  */

  public register() {
    this.persistenceProvider.getMercadoLibreGiftCards(this.getNetwork()).then((giftCards) => {
      if (giftCards) {
        this.homeIntegrationsProvider.register(this.homeItem);
      } else {
        this.nextStepsProvider.register(this.nextStepItem);
      }
    });
  }
}

