import { Component, NgZone, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events, ModalController, NavController, Slides } from 'ionic-angular';
import * as _ from 'lodash';
import * as moment from 'moment';
import { FormatCurrencyPipe } from '../../pipes/format-currency';

// Providers
import {
  AppProvider,
  BwcProvider,
  DynamicLinksProvider,
  EmailNotificationsProvider,
  ExternalLinkProvider,
  FeedbackProvider,
  GiftCardProvider,
  HomeIntegrationsProvider,
  Logger,
  MerchantProvider,
  NewFeatureData,
  PersistenceProvider,
  PlatformProvider,
  PopupProvider,
  ProfileProvider,
  ReleaseProvider
} from '../../providers';
import { ActionSheetProvider } from '../../providers/action-sheet/action-sheet';
import { AnalyticsProvider } from '../../providers/analytics/analytics';
import { ConfigProvider } from '../../providers/config/config';
import {
  hasPromotion,
  hasVisibleDiscount
} from '../../providers/gift-card/gift-card';
import { CardConfig } from '../../providers/gift-card/gift-card.types';

// Pages
import { ExchangeCryptoPage } from '../exchange-crypto/exchange-crypto';
import { BitPayCardIntroPage } from '../integrations/bitpay-card/bitpay-card-intro/bitpay-card-intro';
import { PhaseOneCardIntro } from '../integrations/bitpay-card/bitpay-card-phases/phase-one/phase-one-intro-page/phase-one-intro-page';
import { CoinbasePage } from '../integrations/coinbase/coinbase';
import { BuyCardPage } from '../integrations/gift-cards/buy-card/buy-card';
import { CardCatalogPage } from '../integrations/gift-cards/card-catalog/card-catalog';
import { NewFeaturePage } from '../new-feature/new-feature';
import { AddFundsPage } from '../onboarding/add-funds/add-funds';
import { AmountPage } from '../send/amount/amount';
import { AltCurrencyPage } from '../settings/alt-currency/alt-currency';

export interface Advertisement {
  name: string;
  advertisementId?: string;
  title: string;
  country?: string;
  body: string;
  app: string;
  linkText: string;
  link: any;
  isTesting: boolean;
  linkParams?: any;
  dismissible: true;
  imgSrc: string;
  signature?: string;
}

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  public tapped = 0;
  showBuyCryptoOption: boolean;
  showExchangeCryptoOption: boolean;
  showShoppingOption: boolean;
  @ViewChild('showCard')
  showCard;

  @ViewChild(Slides) slides: Slides;
  public serverMessages: any[];
  public showServerMessage: boolean;
  public showAdvertisements: boolean;
  public advertisements: Advertisement[] = [];
  public productionAds: Advertisement[] = [];
  public testingAds: Advertisement[] = [];
  public totalBalanceAlternative: string;
  public totalBalanceAlternativeIsoCode: string;
  public totalBalanceChange: number;
  public showTotalBalance: boolean = true;
  public fetchingStatus: boolean;
  public showRateCard: boolean;
  public accessDenied: boolean;
  public discountedCard: CardConfig;
  public newReleaseAvailable: boolean = false;
  public cardExperimentEnabled: boolean;
  public testingAdsEnabled: boolean;
  public showCoinbase: boolean = false;
  private hasOldCoinbaseSession: boolean;
  private newReleaseVersion: string;
  private pagesMap: any;

  private isCordova: boolean;
  private zone;

  constructor(
    private persistenceProvider: PersistenceProvider,
    private logger: Logger,
    private analyticsProvider: AnalyticsProvider,
    private appProvider: AppProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private formatCurrencyPipe: FormatCurrencyPipe,
    private navCtrl: NavController,
    private giftCardProvider: GiftCardProvider,
    private merchantProvider: MerchantProvider,
    private feedbackProvider: FeedbackProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private translate: TranslateService,
    private configProvider: ConfigProvider,
    private events: Events,
    private releaseProvider: ReleaseProvider,
    private bwcProvider: BwcProvider,
    private platformProvider: PlatformProvider,
    private modalCtrl: ModalController,
    private profileProvider: ProfileProvider,
    private actionSheetProvider: ActionSheetProvider,
    private dynamicLinkProvider: DynamicLinksProvider,
    private newFeatureData: NewFeatureData,
    private emailProvider: EmailNotificationsProvider,
    private popupProvider: PopupProvider
  ) {
    this.logger.info('Loaded: HomePage');
    this.zone = new NgZone({ enableLongStackTrace: false });
    this.subscribeEvents();
    this.persistenceProvider
      .getCardExperimentFlag()
      .then(status => (this.cardExperimentEnabled = status === 'enabled'));
    this.persistenceProvider
      .getTestingAdvertisments()
      .then(testing => (this.testingAdsEnabled = testing === 'enabled'));
    this.isCordova = this.platformProvider.isCordova;
    this.pagesMap = {
      BuyCardPage,
      BitPayCardIntroPage,
      CardCatalogPage,
      CoinbasePage
    };
  }

  private showNewFeatureSlides() {
    if (this.appProvider.isLockModalOpen) return;
    const disclaimerAccepted = this.profileProvider.profile.disclaimerAccepted;
    if (!disclaimerAccepted) {
      // first time using the App -> don't show
      this.persistenceProvider.setNewFeatureSlidesFlag(
        this.appProvider.version.major
      );
      return;
    }
    this.persistenceProvider.getNewFeatureSlidesFlag().then(value => {
      if (!value || value !== this.appProvider.version.major) {
        const feature_list = this.newFeatureData.get();
        if (feature_list && feature_list.features.length > 0) {
          const modal = this.modalCtrl.create(NewFeaturePage, {
            featureList: feature_list
          });
          modal.present();
          modal.onDidDismiss(data => {
            if (data) {
              if (typeof data === 'boolean' && data === true) {
                this.persistenceProvider.setNewFeatureSlidesFlag(
                  this.appProvider.version.major
                );
              } else if (typeof data !== 'boolean') {
                this.events.publish('IncomingDataRedir', data);
              }
              this.events.unsubscribe('Local/showNewFeaturesSlides');
            }
          });
        } else {
          this.persistenceProvider.setNewFeatureSlidesFlag(
            this.appProvider.info.version
          );
        }
      }
    });
  }

  async ionViewWillEnter() {
    const config = this.configProvider.get();
    this.totalBalanceAlternativeIsoCode =
      config.wallet.settings.alternativeIsoCode;
    this.events.publish('Local/showNewFeaturesSlides');
    this.setMerchantDirectoryAdvertisement();
    this.checkFeedbackInfo();
    this.showTotalBalance = config.totalBalance.show;
    if (this.showTotalBalance)
      this.updateTotalBalance(this.appProvider.homeBalance);
    if (this.platformProvider.isElectron) this.checkNewRelease();
    this.showCoinbase = !!config.showIntegration['coinbase'];
    this.setIntegrations();
    this.loadAds();
    this.fetchAdvertisements();
    this.fetchGiftCardAdvertisement();
    this.persistenceProvider.getDynamicLink().then((deepLink: string) => {
      if (deepLink) {
        this.persistenceProvider.setOnboardingFlowFlag('disabled');
        this.persistenceProvider.removeDynamicLink();
        this.dynamicLinkProvider.processDeepLink(deepLink);
      } else {
        this.persistenceProvider
          .getOnboardingFlowFlag()
          .then((value: string) => {
            if (value === 'enabled' && this.appProvider.info.name !== 'copay')
              this.openAddFunds();
          });
      }
    });
  }

  ionViewDidLoad() {
    this.preFetchWallets();
    this.merchantProvider.getMerchants();
    this.giftCardProvider.getCountry();

    // Required delay to improve performance loading
    setTimeout(() => {
      this.checkEmailLawCompliance();
    }, 2000);
  }

  private async loadAds() {
    const client = this.bwcProvider.getClient(null, {});

    client.getAdvertisements(
      { testing: this.testingAdsEnabled },
      (err, ads) => {
        if (err) throw err;

        if (this.testingAdsEnabled) {
          _.forEach(ads, ad => {
            const alreadyVisible = this.testingAds.find(
              a => a.name === ad.name
            );
            this.persistenceProvider
              .getAdvertisementDismissed(ad.name)
              .then((value: string) => {
                if (value === 'dismissed') {
                  return;
                }

                let link = this.getAdPageOrLink(ad.linkUrl);

                !alreadyVisible &&
                  this.verifySignature(ad) &&
                  ad.isTesting &&
                  this.testingAds.push({
                    name: ad.name,
                    advertisementId: ad.advertisementId,
                    country: ad.country,
                    title: ad.title,
                    body: ad.body,
                    app: ad.app,
                    linkText: ad.linkText,
                    link,
                    imgSrc: ad.imgUrl,
                    signature: ad.signature,
                    isTesting: ad.isTesting,
                    dismissible: true
                  });
              });
          });
        } else {
          _.forEach(ads, ad => {
            const alreadyVisible = this.advertisements.find(
              a => a.name === ad.name
            );
            this.persistenceProvider
              .getAdvertisementDismissed(ad.name)
              .then((value: string) => {
                if (value === 'dismissed') {
                  return;
                }

                let link = this.getAdPageOrLink(ad.linkUrl);

                !alreadyVisible &&
                  this.verifySignature(ad) &&
                  this.advertisements.push({
                    name: ad.name,
                    country: ad.country,
                    advertisementId: ad.advertisementId,
                    title: ad.title,
                    body: ad.body,
                    app: ad.app,
                    linkText: ad.linkText,
                    link,
                    imgSrc: ad.imgUrl,
                    signature: ad.signature,
                    isTesting: ad.isTesting,
                    dismissible: true
                  });
              });
          });
        }
      }
    );
  }

  getAdPageOrLink(link) {
    let linkTo;
    // link is of formate page:PAGE_TITLE or url e.g. https://google.com

    if (link.startsWith('page:')) {
      let pageArray = link.split(':');
      let pageTitle = pageArray[1];
      if (pageTitle in this.pagesMap) {
        linkTo = this.pagesMap[pageTitle];
        return linkTo;
      }
    } else if (link.startsWith('https://')) {
      linkTo = link;
    }

    return linkTo;
  }

  private setMerchantDirectoryAdvertisement() {
    const alreadyVisible = this.advertisements.find(
      a => a.name === 'merchant-directory'
    );
    !alreadyVisible &&
      this.advertisements.push({
        name: 'merchant-directory',
        title: this.translate.instant('Merchant Directory'),
        body: this.translate.instant(
          'Learn where you can spend your crypto today.'
        ),
        app: 'bitpay',
        linkText: this.translate.instant('View Directory'),
        link: 'https://bitpay.com/directory/?hideGiftCards=true',
        imgSrc: 'assets/img/icon-merch-dir.svg',
        isTesting: false,
        dismissible: true
      });
  }

  private verifySignature(ad): boolean {
    var adMessage = JSON.stringify({
      advertisementId: ad.advertisementId,
      name: ad.name,
      title: ad.title,
      type: 'standard',
      country: ad.country,
      body: ad.body,
      imgUrl: ad.imgUrl,
      linkText: ad.linkText,
      linkUrl: ad.linkUrl,
      app: ad.app
    });

    const config = this.configProvider.getDefaults();
    const pubKey = config.adPubKey.pubkey;
    if (!pubKey) return false;

    const b = this.bwcProvider.getBitcore();
    const ECDSA = b.crypto.ECDSA;
    const Hash = b.crypto.Hash;

    const sigObj = b.crypto.Signature.fromString(ad.signature);
    const _hashbuf = Hash.sha256(Buffer.from(adMessage));
    const verificationResult = ECDSA.verify(
      _hashbuf,
      sigObj,
      new b.PublicKey(pubKey),
      'little'
    );

    return verificationResult;
  }

  private updateTotalBalance(data) {
    if (!data) return;
    this.zone.run(() => {
      this.totalBalanceAlternative = data.totalBalanceAlternative;
      this.totalBalanceChange = data.totalBalanceChange;
      this.totalBalanceAlternativeIsoCode = data.totalBalanceAlternativeIsoCode;
    });
  }

  private setTotalBalance(data) {
    this.updateTotalBalance(data);
    this.appProvider.homeBalance = data;
    this.persistenceProvider.setTotalBalance(data);
  }

  private subscribeEvents() {
    this.events.subscribe('Local/HomeBalance', data => {
      if (data && this.showTotalBalance) this.setTotalBalance(data);
      else {
        this.totalBalanceAlternative = '0';
      }
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
    this.events.subscribe(
      'CardAdvertisementUpdate',
      ({ status, cards, cardExperimentEnabled }) => {
        const hasGalileo = cards && cards.some(c => c.provider === 'galileo');
        switch (status) {
          case 'connected':
            hasGalileo
              ? this.removeAdvertisement('bitpay-card')
              : this.addBitPayCard();
            break;
          case 'disconnected':
            this.addBitPayCard();
            break;
          default:
            this.cardExperimentEnabled = cardExperimentEnabled;
            if (!hasGalileo) this.addBitPayCard();
        }
      }
    );
    this.events.subscribe('Local/TestAdsToggle', testAdsStatus => {
      this.testingAdsEnabled = testAdsStatus;
    });
    this.events.subscribe('Local/ConnectionError', () => {
      this.fetchingStatus = false;
    });
    this.events.subscribe('Local/UnsupportedAltCurrency', params => {
      this.showInfoSheet(params);
    });
    this.events.subscribe('Local/showNewFeaturesSlides', () => {
      this.showNewFeatureSlides();
    });
  }

  private preFetchWallets() {
    // Avoid heavy tasks that can slow down the unlocking experience
    if (this.appProvider.isLockModalOpen) return;
    this.fetchingStatus = true;
    this.events.publish('Local/FetchWallets');
  }

  private setIntegrations() {
    // Show integrations
    this.showBuyCryptoOption = false;
    this.showExchangeCryptoOption = false;
    this.showShoppingOption = false;
    const integrations = this.homeIntegrationsProvider
      .get()
      .filter(i => i.show);

    integrations.forEach(x => {
      switch (x.name) {
        case 'buycrypto':
          this.showBuyCryptoOption = true;
          break;
        case 'exchangecrypto':
          this.showExchangeCryptoOption = true;
          break;
        case 'giftcards':
          this.showShoppingOption = true;
          this.setGiftCardAdvertisement();
          break;
        case 'coinbase':
          this.showCoinbase =
            x.linked == false && !this.platformProvider.isMacApp();
          this.hasOldCoinbaseSession = x.oldLinked;
          if (this.showCoinbase) this.addCoinbase();
          break;
      }
    });
  }

  private setGiftCardAdvertisement() {
    const alreadyVisible = this.advertisements.find(
      a => a.name === 'amazon-gift-cards'
    );
    !alreadyVisible &&
      !this.platformProvider.isMacApp() &&
      this.advertisements.unshift({
        name: 'amazon-gift-cards',
        title: this.translate.instant('Shop at Amazon'),
        body: this.translate.instant(
          'Leverage your crypto with an amazon.com gift card.'
        ),
        app: 'bitpay',
        linkText: this.translate.instant('Buy Now'),
        link: CardCatalogPage,
        isTesting: false,
        imgSrc: 'assets/img/amazon.svg',
        dismissible: true
      });
  }

  private addBitPayCard() {
    if (!this.isCordova) return;
    const card: Advertisement = this.cardExperimentEnabled
      ? {
          name: 'bitpay-card',
          title: this.translate.instant('Get the BitPay Card'),
          body: this.translate.instant(
            'Designed for people who want to live life on crypto.'
          ),
          app: 'bitpay',
          linkText: this.translate.instant('Order Now'),
          link: BitPayCardIntroPage,
          isTesting: false,
          dismissible: true,
          imgSrc: 'assets/img/bitpay-card/bitpay-card-mc-angled-plain.svg'
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
          isTesting: false,
          dismissible: true,
          imgSrc: 'assets/img/icon-bpcard.svg'
        };
    const alreadyVisible = this.advertisements.find(
      a => a.name === 'bitpay-card'
    );
    !alreadyVisible && this.advertisements.unshift(card);
  }

  private addCoinbase() {
    const alreadyVisible = this.advertisements.find(a => a.name === 'coinbase');
    !alreadyVisible &&
      this.advertisements.unshift({
        name: 'coinbase',
        title: this.hasOldCoinbaseSession
          ? this.translate.instant('Coinbase updated!')
          : this.translate.instant('Connect your Coinbase!'),
        body: this.hasOldCoinbaseSession
          ? this.translate.instant(
              'Reconnect to quickly withdraw and deposit funds.'
            )
          : this.translate.instant('Easily deposit and withdraw funds.'),
        app: 'bitpay',
        linkText: this.hasOldCoinbaseSession
          ? this.translate.instant('Reconnect Account')
          : this.translate.instant('Connect Account'),
        link: CoinbasePage,
        dismissible: true,
        isTesting: false,
        imgSrc: 'assets/img/coinbase/coinbase-icon.png'
      });
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
        body: `Save ${discountText} off ${discountedCard.displayName} gift cards. Limited time offer.`,
        app: 'bitpay',
        linkText: 'Buy Now',
        link: BuyCardPage,
        linkParams: { cardConfig: discountedCard },
        isTesting: false,
        dismissible: true,
        imgSrc: discountedCard.icon
      });
  }

  private addGiftCardPromotion(promotedCard: CardConfig) {
    const promo = promotedCard.promotions[0];
    const advertisementName = promo.shortDescription;
    const alreadyVisible = this.advertisements.find(
      a => a.name === advertisementName
    );
    !alreadyVisible &&
      this.advertisements.unshift({
        name: advertisementName,
        title: promo.title,
        body: promo.description,
        app: 'bitpay',
        linkText: promo.cta || 'Buy Now',
        link: BuyCardPage,
        linkParams: { cardConfig: promotedCard },
        isTesting: false,
        dismissible: true,
        imgSrc: promo.icon
      });
  }

  private async fetchGiftCardAdvertisement() {
    const availableCards = await this.giftCardProvider.getAvailableCards();
    const discountedCard = availableCards.find(cardConfig =>
      hasVisibleDiscount(cardConfig)
    );
    const promotedCard = availableCards.find(card => hasPromotion(card));
    if (discountedCard) {
      this.addGiftCardDiscount(discountedCard);
    } else if (promotedCard) {
      this.addGiftCardPromotion(promotedCard);
    }
  }

  slideChanged() {
    const slideIndex = this.slides && this.slides.getActiveIndex();
    const activeAd = this.advertisements[slideIndex] || { linkParams: {} };
    const cardConfig = activeAd.linkParams && activeAd.linkParams.cardConfig;
    cardConfig && this.logPresentedWithGiftCardPromoEvent(cardConfig);
  }

  public doRefresh(refresher): void {
    this.loadAds();
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
            (!this.showCoinbase && advertisement.name == 'coinbase')
          ) {
            this.removeAdvertisement(advertisement.name);
            return;
          }
          this.showAdvertisements = true;
        });
      this.logger.debug('fetchAdvertisements');
    });
  }

  logPresentedWithGiftCardPromoEvent(promotedCard: CardConfig) {
    this.giftCardProvider.logEvent(
      'presentedWithGiftCardPromo',
      this.giftCardProvider.getPromoEventParams(
        promotedCard,
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
    if (this.testingAdsEnabled) {
      this.testingAds = _.filter(this.testingAds, adv => adv.name !== name);
    } else {
      this.advertisements = _.filter(
        this.advertisements,
        adv => adv.name !== name
      );
    }
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
        'clickedGiftCardPromo',
        this.giftCardProvider.getPromoEventParams(
          params.cardConfig,
          'Home Tab Advertisement'
        )
      );
    }
  }

  public goToShop() {
    this.navCtrl.push(CardCatalogPage);
  }

  public goToAmountPage() {
    this.analyticsProvider.logEvent('buy_crypto_button_clicked', {});
    this.navCtrl.push(AmountPage, {
      fromBuyCrypto: true,
      nextPage: 'CryptoOrderSummaryPage',
      currency: this.configProvider.get().wallet.settings.alternativeIsoCode
    });
  }

  public goToExchangeCryptoPage() {
    this.analyticsProvider.logEvent('exchange_crypto_button_clicked', {});
    this.navCtrl.push(ExchangeCryptoPage, {
      currency: this.configProvider.get().wallet.settings.alternativeIsoCode
    });
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
        this.showCard.setShowSurveyCard(
          timeExceeded && !feedbackInfo.surveyTaken
        );
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

  private openAddFunds(): void {
    const wallets = this.profileProvider.getWallets();
    const modal = this.modalCtrl.create(AddFundsPage, {
      keyId: wallets[0].credentials.keyId
    });
    modal.present().then(() => {
      this.persistenceProvider.setOnboardingFlowFlag('disabled');
    });
  }

  private showInfoSheet(params): void {
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'unsupported-alt-currency',
      params.altCurrency
    );
    infoSheet.present();
    infoSheet.onDidDismiss(option => {
      this.events.unsubscribe('Local/UnsupportedAltCurrency');
      if (option) {
        this.navCtrl.parent.select(params.tabIndex);
        this.navCtrl.push(AltCurrencyPage);
      }
    });
  }

  private openEmailDisclaimer() {
    const message = this.translate.instant(
      'By providing your email address, you give explicit consent to BitPay to use your email address to send you email notifications about payments.'
    );
    const title = this.translate.instant('Privacy Policy update');
    const okText = this.translate.instant('Accept');
    const cancelText = this.translate.instant('Disable notifications');
    this.popupProvider
      .ionicConfirm(title, message, okText, cancelText)
      .then(ok => {
        if (ok) {
          // Accept new Privacy Policy
          this.persistenceProvider.setEmailLawCompliance('accepted');
        } else {
          // Disable email notifications
          this.persistenceProvider.setEmailLawCompliance('rejected');
          this.emailProvider.updateEmail({
            enabled: false,
            email: 'null@email'
          });
        }
      });
  }

  private checkEmailLawCompliance(): void {
    setTimeout(() => {
      if (this.emailProvider.getEmailIfEnabled()) {
        this.persistenceProvider.getEmailLawCompliance().then(value => {
          if (!value) this.openEmailDisclaimer();
        });
      }
    }, 2000);
  }
}

function getGiftCardAdvertisementName(discountedCard: CardConfig): string {
  return `${discountedCard.discounts[0].code}-${discountedCard.name}-gift-card-discount`;
}
