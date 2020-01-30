import { Component, NgZone, ViewChild } from '@angular/core';
import { NavController, Slides } from 'ionic-angular';
import * as _ from 'lodash';
import * as moment from 'moment';
import { IntegrationsPage } from '../../pages/integrations/integrations';
import { SimplexPage } from '../../pages/integrations/simplex/simplex';
import { SimplexBuyPage } from '../../pages/integrations/simplex/simplex-buy/simplex-buy';
import {
  AppProvider,
  ExternalLinkProvider,
  FeedbackProvider,
  Logger,
  PersistenceProvider,
  ProfileProvider,
  SimplexProvider,
  WalletProvider
} from '../../providers';
import { ConfigProvider } from '../../providers/config/config';
import { CurrencyProvider } from '../../providers/currency/currency';
import { ExchangeRatesProvider } from '../../providers/exchange-rates/exchange-rates';
import { HomeIntegrationsProvider } from '../../providers/home-integrations/home-integrations';
import { RateProvider } from '../../providers/rate/rate';
import { BitPayCardIntroPage } from '../integrations/bitpay-card/bitpay-card-intro/bitpay-card-intro';
import { CardCatalogPage } from '../integrations/gift-cards/card-catalog/card-catalog';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  showBuyCryptoOption: boolean;
  showServicesOption: boolean;
  showShopOption: boolean;
  @ViewChild('showSurvey')
  showSurvey;
  @ViewChild('showCard')
  showCard;

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
      /* imgSrc: TODO 'assets/img/bitpay-card-solid.svg' */
      imgSrc: 'assets/img/bitpay-card/bitpay-card-visa.svg'
    },
    {
      name: 'merchant-directory',
      title: 'Merchant Directory',
      body: 'Learn where you can spend your crypto today.',
      app: 'bitpay',
      linkText: 'View Directory',
      link: 'https://bitpay.com/directory/?hideGiftCards=true',
      imgSrc: 'assets/img/gumball-3.svg',
      dismissible: true
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
  public balanceHidden: boolean = true;
  public homeIntegrations;
  public fetchingStatus: boolean;
  public showRateCard: boolean;
  public accessDenied: boolean;

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
    private rateProvider: RateProvider,
    private simplexProvider: SimplexProvider,
    private feedbackProvider: FeedbackProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider
  ) {
    this.zone = new NgZone({ enableLongStackTrace: false });
  }

  ionViewWillEnter() {
    this.showSurveyCard();
    this.checkFeedbackInfo();

    this.isBalanceHidden();
    this.fetchStatus();
    this.fetchAdvertisements();
    // Show integrations
    const integrations = this.homeIntegrationsProvider
      .get()
      .filter(i => i.show)
      .filter(i => i.name !== 'giftcards' && i.name !== 'debitcard');

    // Hide BitPay if linked
    setTimeout(() => {
      this.showServicesOption = false;
      this.showShopOption = true;
      this.homeIntegrations = _.remove(_.clone(integrations), x => {
        this.showBuyCryptoOption = x.name == 'simplex' && x.show == true;
        if (x.name == 'debitcard' && x.linked) return false;
        else {
          if (x.name != 'simplex') {
            this.showServicesOption = true;
          }
          return x;
        }
      });
    }, 200);
  }

  private debounceRefreshHomePage = _.debounce(async () => {}, 5000, {
    leading: true
  });

  public doRefresh(refresher): void {
    this.debounceRefreshHomePage();
    setTimeout(() => {
      this.fetchStatus();
      this.fetchAdvertisements();
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

    this.fetchingStatus = true;
    this.wallets = this.profileProvider.getWallets();
    this.setIsoCode();
    this.lastWeekRatesArray = await this.getLastWeekRates();
    if (_.isEmpty(this.wallets)) {
      this.fetchingStatus = false;
      return;
    }
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
            const balance =
              status.wallet.coin === 'xrp'
                ? status.availableBalanceSat
                : status.totalBalanceSat;
            walletTotalBalanceAlternativeLastWeek = parseFloat(
              this.getWalletTotalBalanceAlternativeLastWeek(
                balance,
                wallet.coin
              )
            );
            if (status.wallet.coin === 'xrp') {
              walletTotalBalanceAlternative = parseFloat(
                this.getWalletTotalBalanceAlternative(
                  status.availableBalanceSat,
                  'xrp'
                )
              );
            } else {
              walletTotalBalanceAlternative = parseFloat(
                status.totalBalanceAlternative.replace(/,/g, '')
              );
            }
          }
          return Promise.resolve({
            walletTotalBalanceAlternative,
            walletTotalBalanceAlternativeLastWeek
          });
        })
        .catch(err => {
          if (err.message === '403') {
            this.accessDenied = true;
          }
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
          _.compact(balanceAlternativeArray),
          b => b.walletTotalBalanceAlternative
        ).toFixed(2);
        const totalBalanceAlternativeLastMonth = _.sumBy(
          _.compact(balanceAlternativeArray),
          b => b.walletTotalBalanceAlternativeLastWeek
        ).toFixed(2);
        const difference =
          parseFloat(this.totalBalanceAlternative.replace(/,/g, '')) -
          parseFloat(totalBalanceAlternativeLastMonth.replace(/,/g, ''));
        this.averagePrice =
          (difference * 100) /
          parseFloat(this.totalBalanceAlternative.replace(/,/g, ''));
        this.fetchingStatus = false;
      });
    });
  }
  private getWalletTotalBalanceAlternativeLastWeek(
    balanceSat: number,
    coin: string
  ): string {
    return this.rateProvider
      .toFiat(balanceSat, this.totalBalanceAlternativeIsoCode, coin, {
        customRate: this.lastWeekRatesArray[coin]
      })
      .toFixed(2);
  }

  private getWalletTotalBalanceAlternative(
    balanceSat: number,
    coin: string
  ): string {
    return this.rateProvider
      .toFiat(balanceSat, this.totalBalanceAlternativeIsoCode, coin)
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
    if (this.slides) this.slides.slideTo(0, 500);
  }

  public goTo(page) {
    if (typeof page === 'string' && page.indexOf('https://') === 0) {
      this.externalLinkProvider.open(page);
    } else {
      this.navCtrl.push(page);
    }
  }

  public goToShop() {
    this.navCtrl.push(CardCatalogPage);
  }

  public goToServices() {
    this.navCtrl.push(IntegrationsPage, {
      homeIntegrations: this.homeIntegrations
    });
  }

  public goToBuyCrypto() {
    this.simplexProvider.getSimplex().then(simplexData => {
      if (simplexData && !_.isEmpty(simplexData)) {
        this.navCtrl.push(SimplexPage);
      } else {
        this.navCtrl.push(SimplexBuyPage);
      }
    });
  }

  private isBalanceHidden() {
    this.profileProvider
      .getHideTotalBalanceFlag()
      .then(isHidden => {
        this.zone.run(() => {
          this.balanceHidden = isHidden;
        });
      })
      .catch(err => {
        this.logger.error(err);
      });
  }

  private async showSurveyCard() {
    const hideSurvey = await this.persistenceProvider.getSurveyFlag();
    this.showSurvey.setShowSurveyCard(!hideSurvey);
  }

  private checkFeedbackInfo() {
    // Hide feeback card if survey card is shown
    // TODO remove this condition
    if (this.showSurvey) return;
    this.persistenceProvider.getFeedbackInfo().then(info => {
      if (!info) {
        this.initFeedBackInfo();
      } else {
        const feedbackInfo = info;
        // Check if current version is greater than saved version
        const currentVersion = this.appProvider.info.version;
        const savedVersion = feedbackInfo.version;
        const isVersionUpdated = this.feedbackProvider.isVersionUpdated(
          currentVersion,
          savedVersion
        );
        if (!isVersionUpdated) {
          this.initFeedBackInfo();
          return;
        }
        const now = moment().unix();
        const timeExceeded = now - feedbackInfo.time >= 24 * 7 * 60 * 60;
        this.showRateCard = timeExceeded && !feedbackInfo.sent;
        this.showCard.setShowRateCard(this.showRateCard);
      }
    });
  }

  private initFeedBackInfo() {
    this.persistenceProvider.setFeedbackInfo({
      time: moment().unix(),
      version: this.appProvider.info.version,
      sent: false
    });
    this.showRateCard = false;
  }

  public openCountryBannedLink(): void {
    const url =
      "https://github.com/bitpay/copay/wiki/Why-can't-I-use-BitPay's-services-in-my-country%3F";
    this.externalLinkProvider.open(url);
  }
}
