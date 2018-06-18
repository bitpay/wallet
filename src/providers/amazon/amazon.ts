import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { Logger } from '../../providers/logger/logger';

// providers
import { ConfigProvider } from '../config/config';
import { HomeIntegrationsProvider } from '../home-integrations/home-integrations';
import { PersistenceProvider } from '../persistence/persistence';

@Injectable()
export class AmazonProvider {
  public credentials;
  public limitPerDay: number;
  public country: string;
  public currency: string;
  public redeemAmazonUrl: string;
  public amazonNetwork: string;

  constructor(
    private http: HttpClient,
    private logger: Logger,
    private persistenceProvider: PersistenceProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private configProvider: ConfigProvider
  ) {
    this.logger.info('AmazonProvider initialized.');
    this.credentials = {};
    /*
    * Development: 'testnet'
    * Production: 'livenet'
    */
    this.credentials.NETWORK = 'livenet';
    this.credentials.BITPAY_API_URL =
      this.credentials.NETWORK === 'testnet'
        ? 'https://test.bitpay.com'
        : 'https://bitpay.com';
    this.setCountryParameters();
  }

  public getNetwork(): string {
    return this.credentials.NETWORK;
  }

  public setCountryParameters(country?: string): void {
    switch (country) {
      case 'japan':
        this.country = 'japan';
        this.currency = 'JPY';
        this.limitPerDay = 200000;
        this.redeemAmazonUrl = 'https://www.amazon.co.jp/gc/redeem?claimCode=';
        this.amazonNetwork = this.getNetwork() + '-japan';
        break;
      default:
        // For USA
        this.country = 'usa';
        this.currency = 'USD';
        this.limitPerDay = 2000;
        this.redeemAmazonUrl = 'https://www.amazon.com/gc/redeem?claimCode=';
        this.amazonNetwork = this.getNetwork();
        break;
    }
  }

  public getCountry(): string {
    return this.country;
  }

  public getCurrency(): string {
    return this.currency;
  }

  public getRedeemAmazonUrl(): string {
    return this.redeemAmazonUrl;
  }

  public savePendingGiftCard(gc, opts, cb) {
    this.persistenceProvider
      .getAmazonGiftCards(this.amazonNetwork)
      .then(oldGiftCards => {
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
          delete inv[gc.invoiceId];
        }

        inv = JSON.stringify(inv);
        this.persistenceProvider.setAmazonGiftCards(this.amazonNetwork, inv);
        return cb(null);
      });
  }

  public getPendingGiftCards(cb) {
    this.persistenceProvider
      .getAmazonGiftCards(this.amazonNetwork)
      .then(giftCards => {
        return cb(null, giftCards && !_.isEmpty(giftCards) ? giftCards : null);
      })
      .catch(err => {
        return cb(err);
      });
  }

  public createBitPayInvoice(data, cb) {
    var dataSrc = {
      currency: data.currency,
      amount: data.amount,
      clientId: data.uuid,
      email: data.email,
      buyerSelectedTransactionCurrency: data.buyerSelectedTransactionCurrency
    };

    this.http
      .post(this.credentials.BITPAY_API_URL + '/amazon-gift/pay', dataSrc)
      .subscribe(
        data => {
          this.logger.info('BitPay Create Invoice: SUCCESS');
          return cb(null, data);
        },
        data => {
          this.logger.error(
            'BitPay Create Invoice: ERROR ' + data.error.message
          );
          return cb(data.error);
        }
      );
  }

  public getBitPayInvoice(id, cb) {
    this.http
      .get(this.credentials.BITPAY_API_URL + '/invoices/' + id)
      .subscribe(
        (data: any) => {
          this.logger.info('BitPay Get Invoice: SUCCESS');
          return cb(null, data.data);
        },
        data => {
          this.logger.error('BitPay Get Invoice: ERROR ' + data.error.message);
          return cb(data.error.message);
        }
      );
  }

  public createGiftCard(data, cb) {
    var dataSrc = {
      clientId: data.uuid,
      invoiceId: data.invoiceId,
      accessKey: data.accessKey
    };

    this.http
      .post(this.credentials.BITPAY_API_URL + '/amazon-gift/redeem', dataSrc)
      .subscribe(
        (data: any) => {
          var status =
            data.status == 'new'
              ? 'PENDING'
              : data.status == 'paid'
                ? 'PENDING'
                : data.status;
          data.status = status;
          this.logger.info('Amazon Gift Card Create/Update: ' + status);
          return cb(null, data);
        },
        data => {
          this.logger.error(
            'Amazon Gift Card Create/Update: ' + data.message
          );
          return cb(data);
        }
      );
  }

  public cancelGiftCard(data, cb) {
    var dataSrc = {
      clientId: data.uuid,
      invoiceId: data.invoiceId,
      accessKey: data.accessKey
    };

    this.http
      .post(this.credentials.BITPAY_API_URL + '/amazon-gift/cancel', dataSrc)
      .subscribe(
        data => {
          this.logger.info('Amazon Gift Card Cancel: SUCCESS');
          return cb(null, data);
        },
        data => {
          this.logger.error('Amazon Gift Card Cancel: ' + data.message);
          return cb(data);
        }
      );
  }

  public register() {
    this.homeIntegrationsProvider.register({
      name: 'amazon',
      title: 'Amazon Gift Cards',
      icon: 'assets/img/amazon/icon-amazon.svg',
      page: 'AmazonPage',
      show: !!this.configProvider.get().showIntegration['amazon']
    });
    this.homeIntegrationsProvider.register({
      name: 'amazonJapan',
      title: 'Amazon ギフト券',
      icon: 'assets/img/amazon/icon-amazon.svg',
      page: 'AmazonPage',
      show: !!this.configProvider.get().showIntegration['amazonJapan']
    });
  }
}
