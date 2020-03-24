import { Component, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events, ModalController, NavController, Slides } from 'ionic-angular';
import * as _ from 'lodash';
import * as moment from 'moment';
import { IntegrationsPage } from '../../pages/integrations/integrations';
import { SimplexPage } from '../../pages/integrations/simplex/simplex';
import { SimplexBuyPage } from '../../pages/integrations/simplex/simplex-buy/simplex-buy';
import { FormatCurrencyPipe } from '../../pipes/format-currency';
import {
  AppProvider,
  ExternalLinkProvider,
  FeedbackProvider,
  GiftCardProvider,
  Logger,
  PersistenceProvider,
  SimplexProvider
} from '../../providers';
import { AnalyticsProvider } from '../../providers/analytics/analytics';
import { ConfigProvider } from '../../providers/config/config';
import { hasVisibleDiscount } from '../../providers/gift-card/gift-card';
import { CardConfig } from '../../providers/gift-card/gift-card.types';
import { HomeIntegrationsProvider } from '../../providers/home-integrations/home-integrations';
import { PlatformProvider } from '../../providers/platform/platform';
import { ReleaseProvider } from '../../providers/release/release';
import { BitPayCardIntroPage } from '../integrations/bitpay-card/bitpay-card-intro/bitpay-card-intro';
import { PhaseOneCardIntro } from '../integrations/bitpay-card/bitpay-card-phases/phase-one/phase-one-intro-page/phase-one-intro-page';
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
  public showAdvertisements: boolean;
  public advertisements: Advertisement[] = [
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
  public totalBalanceAlternative: string = '0';
  public totalBalanceAlternativeIsoCode: string;
  public averagePrice: number;
  public showTotalBalance: boolean = true;
  public homeIntegrations;
  public fetchingStatus: boolean;
  public showRateCard: boolean;
  public accessDenied: boolean;
  public discountedCard: CardConfig;
  public newReleaseAvailable: boolean = false;
  public cardExperimentEnabled: boolean;
  private newReleaseVersion: string;

  constructor(
    private persistenceProvider: PersistenceProvider,
    private logger: Logger,
    private analyticsProvider: AnalyticsProvider,
    private appProvider: AppProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private formatCurrencyPipe: FormatCurrencyPipe,
    private navCtrl: NavController,
    private giftCardProvider: GiftCardProvider,
    private simplexProvider: SimplexProvider,
    private feedbackProvider: FeedbackProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private modalCtrl: ModalController,
    private translate: TranslateService,
    private configProvider: ConfigProvider,
    private events: Events,
    private releaseProvider: ReleaseProvider,
    private platformProvider: PlatformProvider
  ) {
    this.logger.info('Loaded: HomePage');
    this.subscribeEvents();
    this.persistenceProvider
      .getCardExperimentFlag()
      .then(status => (this.cardExperimentEnabled = status === 'enabled'));
  }

  async ionViewWillEnter() {
    const config = this.configProvider.get();
    this.totalBalanceAlternativeIsoCode =
      config.wallet.settings.alternativeIsoCode;
    this.showNewDesignSlides();
    this.showSurveyCard();
    this.checkFeedbackInfo();
    this.showTotalBalance = config.totalBalance.show;
    if (this.showTotalBalance) this.getCachedTotalBalance();
    if (this.platformProvider.isElectron) this.checkNewRelease();
    this.setIntegrations();
    this.fetchAdvertisements();
    await this.setDiscountedCard();
    this.fetchDiscountAdvertisements();
  }

  ionViewDidLoad() {
    this.preFetchWallets();
  }

  private getCachedTotalBalance() {
    this.persistenceProvider.getTotalBalance().then(data => {
      if (!data) return;
      if (_.isString(data)) {
        data = JSON.parse(data);
      }
      this.updateTotalBalance(data);
    });
  }

  private updateTotalBalance(data) {
    this.totalBalanceAlternative = data.totalBalanceAlternative;
    this.averagePrice = data.averagePrice;
    this.totalBalanceAlternativeIsoCode = data.totalBalanceAlternativeIsoCode;
  }

  private setTotalBalance(data) {
    this.updateTotalBalance(data);
    this.persistenceProvider.setTotalBalance(data);
  }

  private subscribeEvents() {
    this.events.subscribe('Local/HomeBalance', data => {
      if (data && this.showTotalBalance) this.setTotalBalance(data);
      this.fetchingStatus = false;
    });
    this.events.subscribe('Local/ServerMessages', data => {
      this.serverMessages = _.orderBy(
        data.serverMessages,
        ['priority'],
        ['asc']
      );
      this.serverMessages.forEach(serverMessage => {
        this.checkServerMessage(serverMessage);
      });
    });
    this.events.subscribe('Local/AccessDenied', () => {
      this.accessDenied = true;
    });
    this.events.subscribe('Local/FetchCards', bpCards => {
      if (!bpCards) this.addBitPayCard();
    });
  }

  private preFetchWallets() {
    this.fetchingStatus = true;
    this.events.publish('Local/FetchWallets');
  }

  private setIntegrations() {
    // Show integrations
    const integrations = this.homeIntegrationsProvider
      .get()
      .filter(i => i.show)
      .filter(i => i.name !== 'giftcards' && i.name !== 'debitcard');

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

  private addBitPayCard() {
    const card: Advertisement = this.cardExperimentEnabled
      ? {
          name: 'bitpay-card',
          title: this.translate.instant('Fund it. Spend it.'),
          body: this.translate.instant(
            'Instantly reload your card with no conversion fee!'
          ),
          app: 'bitpay',
          linkText: this.translate.instant('Order'),
          link: BitPayCardIntroPage,
          dismissible: true,
          imgSrc: 'assets/img/icon-bpcard.svg'
        }
      : {
          name: 'bitpay-card',
          title: this.translate.instant('Coming soon'),
          body: this.translate.instant(
            'Join the waitlist and be first to experience the new card.'
          ),
          app: 'bitpay',
          linkText: this.translate.instant('Notify Me'),
          link: PhaseOneCardIntro,
          dismissible: true,
          imgSrc: 'assets/img/icon-bpcard.svg'
        };
    const alreadyVisible = this.advertisements.find(
      a => a.name === 'bitpay-card'
    );
    !alreadyVisible && this.advertisements.unshift(card);
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

  public doRefresh(refresher): void {
    this.fetchAdvertisements();
    this.preFetchWallets();
    setTimeout(() => {
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

  public dismissNewReleaseMessage(): void {
    this.newReleaseAvailable = false;
    this.logger.debug(
      `New release message dismissed. version: ${this.newReleaseVersion}`
    );
    this.persistenceProvider.setNewReleaseMessageDismissed(
      this.newReleaseVersion
    );
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
          if (value === 'dismissed') {
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

  private async showSurveyCard() {
    const hideSurvey = await this.persistenceProvider.getSurveyFlag();
    this.showSurvey.setShowSurveyCard(!hideSurvey);
  }

  private checkNewRelease() {
    this.persistenceProvider
      .getNewReleaseMessageDismissed()
      .then(dismissedVersion => {
        this.releaseProvider.getLatestAppVersion().then((data: any) => {
          if (data && data.version === dismissedVersion) return;
          this.newReleaseVersion = data.version;
          this.newReleaseAvailable = this.releaseProvider.newReleaseAvailable(
            data.version
          );
        });
      });
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

        alert(
          `BitPay ID pairing feature ${res === 'enabled' ? res : 'disabled'}`
        );
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
