import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';

// providers
import { ConfigProvider } from '../config/config';
import { HomeIntegrationsProvider } from '../home-integrations/home-integrations';
import { PersistenceProvider } from '../persistence/persistence';

import * as _ from 'lodash';

@Injectable()
export class MercadoLibreProvider {

  private credentials: any;
  // private availableCountries: any;

  constructor(
    private persistenceProvider: PersistenceProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private http: HttpClient,
    private logger: Logger,
    private configProvider: ConfigProvider
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
    this.credentials.BITPAY_API_URL = this.credentials.NETWORK === 'testnet'
      ? "https://test.bitpay.com"
      : "https://bitpay.com";
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
      email: data.email,
      buyerSelectedTransactionCurrency: data.buyerSelectedTransactionCurrency
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
    this.homeIntegrationsProvider.register({
      name: 'mercadolibre',
      title: 'Mercado Livre Brazil Gift Cards',
      icon: 'assets/img/mercado-libre/icon-ml.svg',
      page: 'MercadoLibrePage',
      show: !!this.configProvider.get().showIntegration['mercadolibre']
    });
  }
}

