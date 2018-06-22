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
  public pageTitle: string;
  public onlyIntegers: boolean;

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
  }

  public getNetwork(): string {
    return this.credentials.NETWORK;
  }

  public async setCurrencyByLocation() {
    return new Promise(resolve => {
      this.getSupportedCards()
      .then( currency => {
        this.setCountryParameters(currency);
        resolve();
      })
      .catch( () => {
        this.setCountryParameters();
        resolve();
      });
    });
  }

  private setCountryParameters(currency?: string): void {
    switch (currency) {
      case 'JPY':
        this.currency = currency;
        this.country = 'japan';
        this.limitPerDay = 200000;
        this.redeemAmazonUrl = 'https://www.amazon.co.jp/gc/redeem?claimCode=';
        this.amazonNetwork = this.getNetwork() + '-japan';
        this.pageTitle = 'Amazon.co.jp ギフト券';
        this.onlyIntegers = true;
        break;
      default:
        // For USA
        this.currency = 'USD'
        this.country = 'usa';
        this.limitPerDay = 2000;
        this.redeemAmazonUrl = 'https://www.amazon.com/gc/redeem?claimCode=';
        this.amazonNetwork = this.getNetwork();
        this.pageTitle = 'Amazon.com Gift Cards';
        this.onlyIntegers = false;
        break;
    }
    this.logger.info('Set Amazon Gift Card to: ' + this.currency);
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

  private getSupportedCards(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http
        .get(this.credentials.BITPAY_API_URL + '/amazon-gift/supportedCards')
        .subscribe(
          data => {
            this.logger.info('Amazon Gift Card Supported Cards: SUCCESS');
            return resolve(data['supportedCards'][0]);
          },
          data => {
            this.logger.error('Amazon Gift Card Supported Cards: ' + data.message);
            return reject(data);
          }
        );
    });
  }

  public register() {
    const showItem = !!this.configProvider.get().showIntegration['amazon'];
    this.homeIntegrationsProvider.register({
      name: 'amazon',
      title: 'Amazon Gift Cards',
      icon: 'assets/img/amazon/icon-amazon.svg',
      page: 'AmazonPage',
      show: showItem
    });
  }
}
