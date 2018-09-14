import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { Logger } from '../../providers/logger/logger';

// providers
import { ConfigProvider } from '../config/config';
import { EmailNotificationsProvider } from '../email-notifications/email-notifications';
import { GiftCard } from '../gift-card/gift-card';
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
  public userInfo: object = { email: '' };
  public supportedCurrency: 'USD' | 'JPY';

  constructor(
    private http: HttpClient,
    private logger: Logger,
    private persistenceProvider: PersistenceProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private emailNotificationsProvider: EmailNotificationsProvider,
    private configProvider: ConfigProvider
  ) {
    this.logger.debug('AmazonProvider initialized');
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

  public setCredentials(credentials) {
    this.credentials = credentials;
  }

  public setCurrencyByLocation() {
    return this.getSupportedCurrency()
      .then(currency => this.setCountryParameters(currency))
      .catch(() => this.setCountryParameters());
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
        this.currency = 'USD';
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

  public persistCards(cardMap) {
    return this.persistenceProvider.setAmazonGiftCards(
      this.amazonNetwork,
      cardMap
    );
  }

  public getCardMap() {
    return this.persistenceProvider.getAmazonGiftCards(this.amazonNetwork);
  }

  public async getPurchasedCards() {
    await this.setCurrencyByLocation();
    const giftCardMap = (await this.getCardMap()) || {};
    const invoiceIds = Object.keys(giftCardMap);
    return invoiceIds
      .map(invoiceId => giftCardMap[invoiceId] as GiftCard)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }

  public async getSupportedCurrency(): Promise<string> {
    return this.supportedCurrency
      ? Promise.resolve(this.supportedCurrency)
      : this.http
          .get(this.credentials.BITPAY_API_URL + '/amazon-gift/supportedCards')
          .toPromise()
          .then((data: any) => {
            this.logger.info('Amazon Gift Card Supported Cards: SUCCESS');
            this.supportedCurrency = data.supportedCards[0];
            return this.supportedCurrency;
          })
          .catch(err => {
            this.logger.error(
              'Amazon Gift Card Supported Cards: ' + err.message
            );
            throw err;
          });
  }

  public emailIsValid(email: string): boolean {
    let validEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
      email
    );
    if (!validEmail) return false;
    return true;
  }

  public storeEmail(email: string): void {
    this.setUserInfo({ email });
  }

  public getUserEmail(): Promise<string> {
    return this.persistenceProvider
      .getAmazonUserInfo()
      .then(data => {
        if (_.isString(data)) {
          data = JSON.parse(data);
        }
        let email =
          data && data.email
            ? data.email
            : this.emailNotificationsProvider.getEmailIfEnabled();
        return email;
      })
      .catch(_ => {});
  }

  private setUserInfo(data: any): void {
    if (!_.isString(data)) data = JSON.stringify(data);
    this.persistenceProvider.setAmazonUserInfo(data);
  }

  public register() {
    const showItem = !!this.configProvider.get().showIntegration['amazon'];
    this.homeIntegrationsProvider.register({
      name: 'amazon',
      title: 'Amazon Gift Cards',
      icon: 'assets/img/amazon/amazon-icon.svg',
      show: showItem
    });
  }
}
