import { Component, NgZone, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ModalController, NavController, Slides } from 'ionic-angular';
import * as _ from 'lodash';
import * as moment from 'moment';
import { IntegrationsPage } from '../../pages/integrations/integrations';
import { SimplexPage } from '../../pages/integrations/simplex/simplex';
import { SimplexBuyPage } from '../../pages/integrations/simplex/simplex-buy/simplex-buy';
import { FormatCurrencyPipe } from '../../pipes/format-currency';
import {
  AppProvider,
  BitPayCardProvider,
  ExternalLinkProvider,
  FeedbackProvider,
  GiftCardProvider,
  Logger,
  PersistenceProvider,
  ProfileProvider,
  SimplexProvider,
  TabProvider,
  WalletProvider
} from '../../providers';
import { AnalyticsProvider } from '../../providers/analytics/analytics';
import { ConfigProvider } from '../../providers/config/config';
import { CurrencyProvider } from '../../providers/currency/currency';
import { ExchangeRatesProvider } from '../../providers/exchange-rates/exchange-rates';
import { hasVisibleDiscount } from '../../providers/gift-card/gift-card';
import { CardConfig } from '../../providers/gift-card/gift-card.types';
import { HomeIntegrationsProvider } from '../../providers/home-integrations/home-integrations';
import { RateProvider } from '../../providers/rate/rate';
import { BitPayCardIntroPage } from '../integrations/bitpay-card/bitpay-card-intro/bitpay-card-intro';
import { BuyCardPage } from '../integrations/gift-cards/buy-card/buy-card';
import { CardCatalogPage } from '../integrations/gift-cards/card-catalog/card-catalog';
import { NewDesignTourPage } from '../new-design-tour/new-design-tour';

export interface Advertisement {
  name: string;
  title: string;
  body: string;
  app: string;
  linkText: string;
  link: any;
  linkParams?: any;
  dismissible: true;
  imgSrc: string;
}

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  public tapped = 0;
  showBuyCryptoOption: boolean;
  showServicesOption: boolean = false;
  @ViewChild('showSurvey')
  showSurvey;
  @ViewChild('showCard')
  showCard;

  @ViewChild(Slides) slides: Slides;
  public serverMessages: any[];
  public showServerMessage: boolean;
  public wallets;
  public showAdvertisements: boolean;
  public advertisements: Advertisement[] = [
    {
      name: 'bitpay-card',
      title: this.translate.instant('Get a BitPay Card'),
      body: this.translate.instant(
        'Leverage your crypto with a reloadable BitPay card.'
      ),
      app: 'bitpay',
      linkText: this.translate.instant('Order now'),
      link: BitPayCardIntroPage,
      dismissible: true,
      /* imgSrc: TODO 'assets/img/bitpay-card-solid.svg' */
      imgSrc: 'assets/img/icon-bpcard.svg'
    },
    {
      name: 'merchant-directory',
      title: this.translate.instant('Merchant Directory'),
      body: this.translate.instant(
        'Learn where you can spend your crypto today.'
      ),
      app: 'bitpay',
      linkText: this.translate.instant('View Directory'),
      link: 'https://bitpay.com/directory/?hideGiftCards=true',
      imgSrc: 'assets/img/icon-merch-dir.svg',
      dismissible: true
    },
    {
      name: 'amazon-gift-cards',
      title: this.translate.instant('Shop at Amazon'),
      body: this.translate.instant(
        'Leverage your crypto with an amazon.com gift card.'
      ),
      app: 'bitpay',
      linkText: this.translate.instant('Buy Now'),
      link: CardCatalogPage,
      imgSrc: 'assets/img/amazon.svg',
      dismissible: true
    }
  ];
  public totalBalanceAlternative: string;
  public totalBalanceAlternativeIsoCode: string;
  public averagePrice: number;
  public showBalance: boolean = true;
  public homeIntegrations;
  public fetchingStatus: boolean;
  public showRateCard: boolean;
  public accessDenied: boolean;
  public discountedCard: CardConfig;
  public showBitPayCardAdvertisement: boolean = true;

  private lastDayRatesArray;
  private zone;

  constructor(
    private persistenceProvider: PersistenceProvider,
    private logger: Logger,
    private analyticsProvider: AnalyticsProvider,
    private appProvider: AppProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private formatCurrencyPipe: FormatCurrencyPipe,
    private walletProvider: WalletProvider,
    private profileProvider: ProfileProvider,
    private navCtrl: NavController,
    private configProvider: ConfigProvider,
    private exchangeRatesProvider: ExchangeRatesProvider,
    private giftCardProvider: GiftCardProvider,
    private currencyProvider: CurrencyProvider,
    private rateProvider: RateProvider,
    private simplexProvider: SimplexProvider,
    private feedbackProvider: FeedbackProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private tabProvider: TabProvider,
    private modalCtrl: ModalController,
    private bitPayCardProvider: BitPayCardProvider,
    private translate: TranslateService
  ) {
    this.zone = new NgZone({ enableLongStackTrace: false });
  }

  async ngOnInit() {
    await this.tabProvider.prefetchCards();
  }

  async ionViewWillEnter() {
    this.showNewDesignSlides();
    this.showSurveyCard();
    this.checkFeedbackInfo();
    this.isBalanceShown();
    this.fetchStatus();
    this.setIntegrations();
    this.fetchAdvertisements();
    await this.setDiscountedCard();
    this.fetchDiscountAdvertisements();
  }

  private setIntegrations() {
    // Show integrations
    const integrations = this.homeIntegrationsProvider
      .get()
      .filter(i => i.show)
      .filter(i => i.name !== 'giftcards' && i.name !== 'debitcard');

    this.bitPayCardProvider.get({ noHistory: true }).then(cards => {
      this.showBitPayCardAdvertisement = cards ? false : true;
    });

    this.homeIntegrations = _.remove(integrations, x => {
      this.showBuyCryptoOption = x.name == 'simplex' && x.show == true;
      if (x.name == 'debitcard' && x.linked) return false;
      else {
        if (x.name != 'simplex') {
          this.showServicesOption = true;
        }
        return x;
      }
    });
  }

  private async setDiscountedCard(): Promise<void> {
    this.discountedCard = await this.getDiscountedCard();
    this.discountedCard && this.addGiftCardDiscount(this.discountedCard);
  }

  private async getDiscountedCard(): Promise<CardConfig> {
    const availableCards = await this.giftCardProvider.getAvailableCards();
    const discountedCard = availableCards.find(cardConfig =>
      hasVisibleDiscount(cardConfig)
    );
    return discountedCard;
  }

  private addGiftCardDiscount(discountedCard: CardConfig) {
    const discount = discountedCard.discounts[0];
    const discountText =
      discount.type === 'flatrate'
        ? `${this.formatCurrencyPipe.transform(
            discount.amount,
            discountedCard.currency,
            'minimal'
          )}`
        : `${discount.amount}%`;
    const advertisementName = getGiftCardAdvertisementName(discountedCard);
    const alreadyVisible = this.advertisements.find(
      a => a.name === advertisementName
    );
    !alreadyVisible &&
      this.advertisements.unshift({
        name: advertisementName,
        title: `${discountText} off ${discountedCard.displayName}`,
        body: `Save ${discountText} off ${
          discountedCard.displayName
        } gift cards. Limited time offer.`,
        app: 'bitpay',
        linkText: 'Buy Now',
        link: BuyCardPage,
        linkParams: { cardConfig: discountedCard },
        dismissible: true,
        imgSrc: discountedCard.icon
      });
  }

  private async fetchGiftCardDiscount() {
    const availableCards = await this.giftCardProvider.getAvailableCards();
    const discountedCard = availableCards.find(cardConfig =>
      hasVisibleDiscount(cardConfig)
    );
    discountedCard && this.addGiftCardDiscount(discountedCard);
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
    this.totalBalanceAlternativeIsoCode = this.configProvider.get().wallet.settings.alternativeIsoCode;
    this.lastDayRatesArray = await this.getLastDayRates();
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
          let walletTotalBalanceAlternativeLastDay = 0;
          if (status.wallet.network === 'livenet' && !wallet.hidden) {
            const balance =
              status.wallet.coin === 'xrp'
                ? status.availableBalanceSat
                : status.totalBalanceSat;
            walletTotalBalanceAlternativeLastDay = parseFloat(
              this.getWalletTotalBalanceAlternativeLastDay(balance, wallet.coin)
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
            walletTotalBalanceAlternativeLastDay
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
        const totalBalanceAlternativeLastDay = _.sumBy(
          _.compact(balanceAlternativeArray),
          b => b.walletTotalBalanceAlternativeLastDay
        ).toFixed(2);
        const difference =
          parseFloat(this.totalBalanceAlternative.replace(/,/g, '')) -
          parseFloat(totalBalanceAlternativeLastDay.replace(/,/g, ''));
        this.averagePrice =
          (difference * 100) /
          parseFloat(this.totalBalanceAlternative.replace(/,/g, ''));
        this.fetchingStatus = false;
      });
    });
  }
  private getWalletTotalBalanceAlternativeLastDay(
    balanceSat: number,
    coin: string
  ): string {
    return this.rateProvider
      .toFiat(balanceSat, this.totalBalanceAlternativeIsoCode, coin, {
        customRate: this.lastDayRatesArray[coin]
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

  private getLastDayRates(): Promise<any> {
    const availableChains = this.currencyProvider.getAvailableChains();
    return new Promise(resolve => {
      this.exchangeRatesProvider
        .getHistoricalRates(this.totalBalanceAlternativeIsoCode)
        .subscribe(
          response => {
            let ratesByCoin = {};
            for (const unitCode of availableChains) {
              ratesByCoin[unitCode] = response[unitCode][0].rate;
            }
            return resolve(ratesByCoin);
          },
          err => {
            this.logger.error('Error getting current rate:', err);
            return resolve();
          }
        );
    });
  }

  private async fetchDiscountAdvertisements(): Promise<void> {
    await this.fetchGiftCardDiscount();
    this.logPresentedWithGiftCardDiscountEvent();
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
          if (
            value === 'dismissed' ||
            (!this.showBitPayCardAdvertisement &&
              advertisement.name == 'bitpay-card')
          ) {
            this.removeAdvertisement(advertisement.name);
            return;
          }
          this.showAdvertisements = true;
        });
      this.logger.debug('fetchAdvertisements');
    });
  }

  logPresentedWithGiftCardDiscountEvent() {
    const giftCardDiscount = this.advertisements.find(a =>
      a.name.includes('gift-card-discount')
    );
    const isCurrentSlide = !this.slides || this.slides.getActiveIndex() === 0;
    giftCardDiscount &&
      isCurrentSlide &&
      this.giftCardProvider.logEvent(
        'presentedWithGiftCardDiscount',
        this.giftCardProvider.getDiscountEventParams(
          this.discountedCard,
          'Home Tab Advertisement'
        )
      );
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

  public goTo(page, params: any = {}) {
    if (typeof page === 'string' && page.indexOf('https://') === 0) {
      this.externalLinkProvider.open(page);
    } else {
      this.navCtrl.push(page, params);
    }
    if (page === BuyCardPage) {
      this.giftCardProvider.logEvent(
        'clickedGiftCardDiscount',
        this.giftCardProvider.getDiscountEventParams(
          params.cardConfig,
          'Home Tab Advertisement'
        )
      );
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
    this.analyticsProvider.logEvent('buy_crypto_button_clicked', {});
    this.simplexProvider.getSimplex().then(simplexData => {
      if (simplexData && !_.isEmpty(simplexData)) {
        this.navCtrl.push(SimplexPage);
      } else {
        this.navCtrl.push(SimplexBuyPage);
      }
    });
  }

  private isBalanceShown() {
    this.profileProvider
      .getShowTotalBalanceFlag()
      .then(isShown => {
        this.zone.run(() => {
          this.showBalance = isShown;
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

  private showNewDesignSlides() {
    if (this.appProvider.isLockModalOpen) return; // Opening a modal together with the lock modal makes the pin pad unresponsive
    this.persistenceProvider.getNewDesignSlidesFlag().then(value => {
      if (!value) {
        this.persistenceProvider.setNewDesignSlidesFlag('completed');
        const modal = this.modalCtrl.create(NewDesignTourPage, {
          showBackdrop: false,
          enableBackdropDismiss: false
        });
        modal.present();
      }
    });
  }

  public enableBitPayIdPairing() {
    this.tapped++;

    if (this.tapped >= 10) {
      this.persistenceProvider.getBitpayIdPairingFlag().then(res => {
        res === 'enabled'
          ? this.persistenceProvider.removeBitpayIdPairingFlag()
          : this.persistenceProvider.setBitpayIdPairingFlag('enabled');

        alert('bitpayID pairing enabled');
        this.tapped = 0;
      });
    }
  }
}

function getGiftCardAdvertisementName(discountedCard: CardConfig): string {
  return `${discountedCard.discounts[0].code}-${
    discountedCard.name
  }-gift-card-discount`;
}
