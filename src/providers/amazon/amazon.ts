import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Logger } from '@nsalaun/ng-logger';

//providers
import { HomeIntegrationsProvider } from '../home-integrations/home-integrations';
import { PersistenceProvider } from '../persistence/persistence';
import { NextStepsProvider } from '../next-steps/next-steps';

import * as _ from 'lodash';

@Injectable()
export class AmazonProvider {

  public credentials: any;
  public limitPerDay: number;
  public homeItem: any;
  public nextStepItem: any;

  constructor(
    private http: HttpClient,
    private logger: Logger,
    private persistenceProvider: PersistenceProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private nextStepsProvider: NextStepsProvider
  ) {
    this.logger.info('AmazonProvider initialized.');
    this.credentials = {};
    /*
    * Development: 'testnet'
    * Production: 'livenet'
    */
    this.credentials.NETWORK = 'livenet';
    //this.this.credentials.NETWORK = 'testnet';
    if (this.credentials.NETWORK == 'testnet') {
      this.credentials.BITPAY_API_URL = "https://test.bitpay.com";
    } else {
      this.credentials.BITPAY_API_URL = "https://bitpay.com";
    };
    this.limitPerDay = 1000;
    this.homeItem = {
      name: 'amazon',
      title: 'Amazon.com Gift Cards',
      icon: 'assets/img/amazon/icon-amazon.svg',
      page: 'AmazonPage',
    };

    this.nextStepItem = {
      name: 'amazon',
      title: 'Buy Amazon.com Gift Cards',
      icon: 'assets/img/amazon/icon-amazon.svg',
      page: 'AmazonPage',
    };
  }

  public getNetwork() {
    return this.credentials.NETWORK;
  };

  public savePendingGiftCard(gc, opts, cb) {
    var network = this.getNetwork();
    this.persistenceProvider.getAmazonGiftCards(network).then((oldGiftCards) => {
      if (_.isString(oldGiftCards)) {
        oldGiftCards = JSON.parse(oldGiftCards);
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
      this.persistenceProvider.setAmazonGiftCards(network, inv).then((err) => {

        this.homeIntegrationsProvider.register(this.homeItem);
        this.nextStepsProvider.unregister(this.nextStepItem.name);
        return cb(err);
      });
    });
  }

  public getPendingGiftCards(cb) {
    var network = this.getNetwork();
    this.persistenceProvider.getAmazonGiftCards(network).then((giftCards) => {
      var _gcds = giftCards ? JSON.parse(giftCards) : null;
      return cb(null, _gcds);
    }).catch((err) => {
      return cb(err);

    });
  };

  public createBitPayInvoice(data, cb) {

    var dataSrc = {
      currency: data.currency,
      amount: data.amount,
      clientId: data.uuid,
      email: data.email
    };

    this.http.post(this.credentials.BITPAY_API_URL + '/amazon-gift/pay', dataSrc).subscribe((data: any) => {
      this.logger.info('BitPay Create Invoice: SUCCESS');
      return cb(null, data);
    }, (data) => {
      this.logger.error('BitPay Create Invoice: ERROR ' + data.error.message);
      return cb(data.error);
    });
  };

  public getBitPayInvoice(id, cb) {
    this.http.get(this.credentials.BITPAY_API_URL + '/invoices/' + id).subscribe((data: any) => {
      this.logger.info('BitPay Get Invoice: SUCCESS');
      return cb(null, data.data);
    }, (data: any) => {
      this.logger.error('BitPay Get Invoice: ERROR ' + data.error.message);
      return cb(data.error.message);
    });
  };

  public createGiftCard(data, cb) {

    var dataSrc = {
      "clientId": data.uuid,
      "invoiceId": data.invoiceId,
      "accessKey": data.accessKey
    };

    this.http.post(this.credentials.BITPAY_API_URL + '/amazon-gift/redeem', dataSrc).subscribe((data: any) => {
      var status = data.data.status == 'new' ? 'PENDING' : (data.data.status == 'paid') ? 'PENDING' : data.data.status;
      data.data.status = status;
      this.logger.info('Amazon.com Gift Card Create/Update: ' + status);
      return cb(null, data.data);
    }, (data: any) => {
      this.logger.error('Amazon.com Gift Card Create/Update: ' + data.data.message);
      return cb(data.data);
    });
  };

  public cancelGiftCard(data, cb) {

    var dataSrc = {
      "clientId": data.uuid,
      "invoiceId": data.invoiceId,
      "accessKey": data.accessKey
    };

    this.http.post(this.credentials.BITPAY_API_URL + '/amazon-gift/cancel', dataSrc).subscribe((data: any) => {
      this.logger.info('Amazon.com Gift Card Cancel: SUCCESS');
      return cb(null, data.data);
    }, (data: any) => {
      this.logger.error('Amazon.com Gift Card Cancel: ' + data.data.message);
      return cb(data.data);
    });
  };

  public register() {
    this.persistenceProvider.getAmazonGiftCards(this.getNetwork()).then((giftCards) => {
      if (giftCards) {
        this.homeIntegrationsProvider.register(this.homeItem);
      } else {
        this.nextStepsProvider.register(this.nextStepItem);
      }
    });
  };

}
