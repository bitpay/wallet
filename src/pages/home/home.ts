import { Component, NgZone, ViewChild } from '@angular/core';
import { NavController, Slides } from 'ionic-angular';
import * as _ from 'lodash';
import {
  AppProvider,
  ExternalLinkProvider,
  Logger,
  PersistenceProvider,
  ProfileProvider,
  WalletProvider
} from '../../providers';
import { ConfigProvider } from '../../providers/config/config';
import { CurrencyProvider } from '../../providers/currency/currency';
import { ExchangeRatesProvider } from '../../providers/exchange-rates/exchange-rates';
import { RateProvider } from '../../providers/rate/rate';
import { BitPayCardIntroPage } from '../integrations/bitpay-card/bitpay-card-intro/bitpay-card-intro';
import { CardCatalogPage } from '../integrations/gift-cards/card-catalog/card-catalog';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  private showPriceChart: boolean;
  @ViewChild('priceCard')
  priceCard;

  @ViewChild(Slides) slides: Slides;
  public serverMessages: any[];
  public showServerMessage: boolean;
  public wallets;
  public showAdvertisements: boolean;
  public advertisements = [
    {
      name: 'bitpay-card',
      title: 'Get a BitPay Card',
      body: 'Leverage your crypto with a reloadable BitPay card.',
      app: 'bitpay',
      linkText: 'Buy Now',
      link: BitPayCardIntroPage,
      dismissible: true,
      imgSrc: 'assets/img/bitpay-card-solid.svg'
    },
    {
      name: 'amazon-gift-cards',
      title: 'Shop at Amazon',
      body: 'Leverage your crypto with an amazon.com gift card.',
      app: 'bitpay',
      linkText: 'Buy Now',
      link: CardCatalogPage,
      imgSrc: 'assets/img/amazon.svg',
      dismissible: true
    }
  ];
  public totalBalanceAlternative: string;
  public totalBalanceAlternativeIsoCode: string;
  public averagePrice: number;

  private lastWeekRatesArray;
  private zone;
  private fiatCodes = [
    'USD',
    'INR',
    'GBP',
    'EUR',
    'CAD',
    'COP',
    'NGN',
    'BRL',
    'ARS',
    'AUD'
  ];

  constructor(
    private persistenceProvider: PersistenceProvider,
    private logger: Logger,
    private appProvider: AppProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private walletProvider: WalletProvider,
    private profileProvider: ProfileProvider,
    private navCtrl: NavController,
    private configProvider: ConfigProvider,
    private exchangeRatesProvider: ExchangeRatesProvider,
    private currencyProvider: CurrencyProvider,
    private rateProvider: RateProvider
  ) {
    this.zone = new NgZone({ enableLongStackTrace: false });
  }

  ionViewWillEnter() {
    this.checkPriceChart();
    this.fetchStatus();
    this.fetchAdvertisements();
  }

  private updateCharts() {
    if (this.showPriceChart && this.priceCard) this.priceCard.updateCharts();
  }

  private debounceRefreshHomePage = _.debounce(async () => { }, 5000, {
    leading: true
  });

  private checkPriceChart() {
    this.persistenceProvider.getHiddenFeaturesFlag().then(res => {
      this.showPriceChart = res === 'enabled' ? true : false;
      this.updateCharts();
    });
  }

  public doRefresh(refresher): void {
    this.debounceRefreshHomePage();
    setTimeout(() => {
      this.fetchStatus();
      this.fetchAdvertisements();
      this.updateCharts();
      refresher.complete();
    }, 2000);
  }

  private removeServerMessage(id): void {
    this.serverMessages = _.filter(this.serverMessages, s => s.id !== id);
  }

  public dismissServerMessage(serverMessage): void {
    this.showServerMessage = false;
    this.logger.debug(`Server message id: ${serverMessage.id} dismissed`);
    this.persistenceProvider.setServerMessageDismissed(serverMessage.id);
    this.removeServerMessage(serverMessage.id);
  }

  public checkServerMessage(serverMessage): void {
    if (serverMessage.app && serverMessage.app != this.appProvider.info.name) {
      this.removeServerMessage(serverMessage.id);
      return;
    }

    /* if ( TODO
      serverMessage.id === 'bcard-atm' &&
      (!this.showBitPayCard ||
        !this.bitpayCardItems ||
        !this.bitpayCardItems[0])
    ) {
      this.removeServerMessage(serverMessage.id);
      return;
    } */

    this.persistenceProvider
      .getServerMessageDismissed(serverMessage.id)
      .then((value: string) => {
        if (value === 'dismissed') {
          this.removeServerMessage(serverMessage.id);
          return;
        }
        this.showServerMessage = true;
      });
  }

  public openServerMessageLink(url): void {
    this.externalLinkProvider.open(url);
  }

  private async fetchStatus() {
    let foundMessage = false;

    this.wallets = this.profileProvider.getWallets();
    this.setIsoCode();
    this.lastWeekRatesArray = await this.getLastWeekRates();
    if (_.isEmpty(this.wallets)) return;

    this.logger.debug('fetchStatus');
    const pr = wallet => {
      return this.walletProvider
        .fetchStatus(wallet, {})
        .then(async status => {
          if (!foundMessage && !_.isEmpty(status.serverMessages)) {
            this.serverMessages = _.orderBy(
              status.serverMessages,
              ['priority'],
              ['asc']
            );
            this.serverMessages.forEach(serverMessage => {
              this.checkServerMessage(serverMessage);
            });
            foundMessage = true;
          }

          let walletTotalBalanceAlternative = 0;
          let walletTotalBalanceAlternativeLastWeek = 0;
          if (status.wallet.network === 'livenet') {
            walletTotalBalanceAlternativeLastWeek = parseFloat(
              this.getWalletTotalBalanceAlternativeLastWeek(
                status.totalBalanceSat,
                status.wallet.coin
              )
            );
            walletTotalBalanceAlternative = parseFloat(
              status.totalBalanceAlternative.replace(/,/g, '')
            );
          }
          return Promise.resolve({
            walletTotalBalanceAlternative,
            walletTotalBalanceAlternativeLastWeek
          });
        })
        .catch(() => {
          return Promise.resolve();
        });
    };

    const promises = [];

    _.each(this.profileProvider.wallet, wallet => {
      promises.push(pr(wallet));
    });

    Promise.all(promises).then(balanceAlternativeArray => {
      this.zone.run(() => {
        this.totalBalanceAlternative = _.sumBy(
          balanceAlternativeArray,
          b => b.walletTotalBalanceAlternative
        ).toFixed(2);
        const totalBalanceAlternativeLastMonth = _.sumBy(
          balanceAlternativeArray,
          b => b.walletTotalBalanceAlternativeLastWeek
        ).toFixed(2);
        const difference =
          parseFloat(this.totalBalanceAlternative.replace(/,/g, '')) -
          parseFloat(totalBalanceAlternativeLastMonth.replace(/,/g, ''));
        this.averagePrice =
          (difference * 100) /
          parseFloat(this.totalBalanceAlternative.replace(/,/g, ''));
      });
    });
  }
  private getWalletTotalBalanceAlternativeLastWeek(
    totalBalanceSat: number,
    coin: string
  ): string {
    return this.rateProvider
      .toFiat(
      totalBalanceSat,
      this.totalBalanceAlternativeIsoCode,
      coin,
      this.lastWeekRatesArray[coin]
      )
      .toFixed(2);
  }

  private getLastWeekRates(): Promise<any> {
    const availableChains = this.currencyProvider.getAvailableChains();
    const getHistoricalRate = unitCode => {
      return new Promise(resolve => {
        this.exchangeRatesProvider
          .getHistoricalRates(this.totalBalanceAlternativeIsoCode, unitCode)
          .subscribe(
          response => {
            return resolve({ rate: response.reverse()[0], unitCode });
          },
          err => {
            this.logger.error('Error getting current rate:', err);
            return resolve();
          }
          );
      });
    };

    const promises = [];
    _.forEach(availableChains, unitCode => {
      promises.push(getHistoricalRate(unitCode));
    });
    return Promise.all(promises).then(lastWeekRates => {
      let ratesByCoin = {};
      lastWeekRates.forEach(lastWeekRate => {
        ratesByCoin[lastWeekRate.unitCode] = lastWeekRate.rate.rate;
      });
      return Promise.resolve(ratesByCoin);
    });
  }

  private setIsoCode() {
    const alternativeIsoCode = this.configProvider.get().wallet.settings
      .alternativeIsoCode;
    this.totalBalanceAlternativeIsoCode = _.includes(
      this.fiatCodes,
      alternativeIsoCode
    )
      ? alternativeIsoCode
      : 'USD';
  }

  private fetchAdvertisements(): void {
    this.advertisements.forEach(advertisement => {
      if (
        advertisement.app &&
        advertisement.app != this.appProvider.info.name
      ) {
        this.removeAdvertisement(advertisement.name);
        return;
      }
      this.persistenceProvider
        .getAdvertisementDismissed(advertisement.name)
        .then((value: string) => {
          if (value === 'dismissed') {
            this.removeAdvertisement(advertisement.name);
            return;
          }
          this.showAdvertisements = true;
        });
      this.logger.debug('fetchAdvertisements');
    });
  }

  public dismissAdvertisement(advertisement): void {
    this.logger.debug(`Advertisement: ${advertisement.name} dismissed`);
    this.persistenceProvider.setAdvertisementDismissed(advertisement.name);
    this.removeAdvertisement(advertisement.name);
  }

  private removeAdvertisement(name): void {
    this.advertisements = _.filter(
      this.advertisements,
      adv => adv.name !== name
    );
    this.slides.slideTo(0, 500);
  }

  public goTo(page) {
    this.navCtrl.push(page);
  }
}
