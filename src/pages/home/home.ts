import { Component, NgZone, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events, ModalController, NavController, Slides } from 'ionic-angular';
import * as _ from 'lodash';
import * as moment from 'moment';

// Providers
import {
  AppProvider,
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
import {
  Advertisement,
  AdvertisementProvider
} from '../../providers/advertisement/advertisement';
import { AnalyticsProvider } from '../../providers/analytics/analytics';
import { ConfigProvider } from '../../providers/config/config';
import { CardConfig } from '../../providers/gift-card/gift-card.types';

// Pages
import { SplashScreen } from '@ionic-native/splash-screen';
import { Network } from '../../providers/persistence/persistence';
import { ExchangeCryptoPage } from '../exchange-crypto/exchange-crypto';
import { BuyCardPage } from '../integrations/gift-cards/buy-card/buy-card';
import { CardCatalogPage } from '../integrations/gift-cards/card-catalog/card-catalog';
import { NewFeaturePage } from '../new-feature/new-feature';
import { AddFundsPage } from '../onboarding/add-funds/add-funds';
import { AmountPage } from '../send/amount/amount';
import { AltCurrencyPage } from '../settings/alt-currency/alt-currency';

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
  private newReleaseVersion: string;

  private zone;

  constructor(
    private advertisementProvider: AdvertisementProvider,
    private persistenceProvider: PersistenceProvider,
    private logger: Logger,
    private analyticsProvider: AnalyticsProvider,
    private appProvider: AppProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private navCtrl: NavController,
    private giftCardProvider: GiftCardProvider,
    private merchantProvider: MerchantProvider,
    private feedbackProvider: FeedbackProvider,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private translate: TranslateService,
    private configProvider: ConfigProvider,
    private events: Events,
    private releaseProvider: ReleaseProvider,
    private platformProvider: PlatformProvider,
    private modalCtrl: ModalController,
    private profileProvider: ProfileProvider,
    private actionSheetProvider: ActionSheetProvider,
    private dynamicLinkProvider: DynamicLinksProvider,
    private newFeatureData: NewFeatureData,
    private emailProvider: EmailNotificationsProvider,
    private popupProvider: PopupProvider,
    private splashScreen: SplashScreen
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
  }

  private showNewFeatureSlides() {
    if (this.appProvider.isLockModalOpen) return;
    this.events.unsubscribe('Local/showNewFeaturesSlides');
    const disclaimerAccepted = this.profileProvider.profile.disclaimerAccepted;
    const currentVs =
      this.appProvider.version.major + '.' + this.appProvider.version.minor;
    if (!disclaimerAccepted) {
      // first time using the App -> don't show
      this.persistenceProvider.setNewFeatureSlidesFlag(currentVs);
      return;
    }
    this.persistenceProvider.getNewFeatureSlidesFlag().then(value => {
      if (!value || String(value) !== currentVs) {
        this.newFeatureData.get().then(feature_list => {
          if (feature_list && feature_list.features.length > 0) {
            const modal = this.modalCtrl.create(NewFeaturePage, {
              featureList: feature_list
            });
            modal.present();
            modal.onDidDismiss(data => {
              if (data) {
                if (typeof data.done === 'boolean' && data.done === true) {
                  this.persistenceProvider.setNewFeatureSlidesFlag(currentVs);
                }
                if (typeof data.data !== 'boolean') {
                  this.events.publish('IncomingDataRedir', data.data);
                }
              }
            });
          } else {
            this.persistenceProvider.setNewFeatureSlidesFlag(currentVs);
          }
        });
      }
    });
  }

  ionViewWillEnter() {
    const config = this.configProvider.get();
    this.totalBalanceAlternativeIsoCode =
      config.wallet.settings.alternativeIsoCode;
    this.events.publish('Local/showNewFeaturesSlides');
    this.checkFeedbackInfo();
    this.showTotalBalance = config.totalBalance.show;
    if (this.showTotalBalance)
      this.updateTotalBalance(this.appProvider.homeBalance);
    if (this.platformProvider.isElectron) this.checkNewRelease();
    this.showCoinbase = !!config.showIntegration['coinbase'];

    this.setIntegrations();

    // Ads
    this.advertisements = this.advertisementProvider.ads;
    this.productionAds = this.advertisementProvider.productionAds;
    this.testingAds = this.advertisementProvider.testingAds;
    this.advertisementProvider.addMerchantDirectory();
    this.advertisementProvider.addDynamicAds();

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

    // Required delay to improve performance loading
    setTimeout(() => {
      this.checkEmailLawCompliance();
    }, 2000);
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
              : this.advertisementProvider.addBitPayCard(
                  this.cardExperimentEnabled
                );
            break;
          case 'disconnected':
            this.advertisementProvider.addBitPayCard(
              this.cardExperimentEnabled
            );
            break;
          default:
            this.cardExperimentEnabled = cardExperimentEnabled;
            if (!hasGalileo)
              this.advertisementProvider.addBitPayCard(
                this.cardExperimentEnabled
              );
        }
      }
    );

    // It doesn't work --- event is not subscribed when it's called from About view
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

    this.events.subscribe('Local/GiftCardDiscount', disc => {
      this.advertisementProvider.addGiftCardDiscount(disc);
    });

    this.events.subscribe('Local/GiftCardPromotion', prom => {
      this.advertisementProvider.addGiftCardPromotion(prom);
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
          this.advertisementProvider.addAmazonGiftCards();
          break;
        case 'coinbase':
          this.showCoinbase =
            x.linked == false && !this.platformProvider.isMacApp();
          if (this.showCoinbase) this.advertisementProvider.addCoinbase();
          break;
      }
    });
  }

  slideChanged() {
    const slideIndex = this.slides && this.slides.getActiveIndex();
    const activeAd = this.advertisements[slideIndex] || { linkParams: {} };
    const cardConfig = activeAd.linkParams && activeAd.linkParams.cardConfig;
    cardConfig && this.logPresentedWithGiftCardPromoEvent(cardConfig);
  }

  public doRefresh(refresher): void {
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
    this.advertisementProvider.remove(name);
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
    this.analyticsProvider.logEvent('buy_crypto_button_clicked', {
      from: 'homePage'
    });
    this.navCtrl.push(AmountPage, {
      fromBuyCrypto: true,
      nextPage: 'CryptoOrderSummaryPage',
      currency: this.configProvider.get().wallet.settings.alternativeIsoCode
    });
  }

  public goToExchangeCryptoPage() {
    this.analyticsProvider.logEvent('exchange_crypto_button_clicked', {
      from: 'homePage'
    });
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

  public toggleTestnet() {
    this.tapped++;
    if (this.tapped >= 10) {
      this.persistenceProvider
        .getNetwork()
        .then((currentNetwork: Network | undefined) => {
          const newNetwork =
            !currentNetwork || currentNetwork === Network.livenet
              ? Network.testnet
              : Network.livenet;
          this.persistenceProvider.setNetwork(newNetwork);
          const infoSheet = this.actionSheetProvider.createInfoSheet(
            'in-app-notification',
            {
              title: 'Network Changed',
              body: `Network changed to ${newNetwork}. Restarting app.`
            }
          );
          infoSheet.present();
          infoSheet.onDidDismiss(() => {
            window.location.reload();
            if (this.platformProvider.isCordova) this.splashScreen.show();
          });

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
