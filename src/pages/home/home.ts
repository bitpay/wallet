import { Component, ComponentRef, NgZone, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events, ModalController, NavController, Slides } from 'ionic-angular';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Observable } from 'rxjs';
import { FormatCurrencyPipe } from '../../pipes/format-currency';
// Providers
import {
  AppProvider,
  BitPayIdProvider,
  BwcProvider,
  DynamicLinksProvider,
  EmailNotificationsProvider,
  ExternalLinkProvider,
  FeedbackProvider,
  GiftCardProvider,
  HomeIntegrationsProvider,
  IABCardProvider,
  Logger,
  MerchantProvider,
  NewFeatureData,
  OnGoingProcessProvider,
  PersistenceProvider,
  PlatformProvider,
  PopupProvider,
  ProfileProvider,
  PushNotificationsProvider,
  RateProvider,
  ReleaseProvider,
  WalletConnectProvider
} from '../../providers';
import {
  ActionSheetProvider,
  InfoSheetType
} from '../../providers/action-sheet/action-sheet';
import { AnalyticsProvider } from '../../providers/analytics/analytics';
import { ConfigProvider } from '../../providers/config/config';
import { DomProvider } from '../../providers/dom/dom';
import {
  hasPromotion,
  hasVisibleDiscount
} from '../../providers/gift-card/gift-card';
import { CardConfig } from '../../providers/gift-card/gift-card.types';

// Pages
import { ActionSheetParent } from '../../components/action-sheet/action-sheet-parent';
import { InfoSheetComponent } from '../../components/info-sheet/info-sheet';
import { User } from '../../models/user/user.model';
import { IncomingDataProvider } from '../../providers/incoming-data/incoming-data';
import { Network } from '../../providers/persistence/persistence';
import { ExchangeCryptoPage } from '../exchange-crypto/exchange-crypto';
import { BitPayCardIntroPage } from '../integrations/bitpay-card/bitpay-card-intro/bitpay-card-intro';
import { PhaseOneCardIntro } from '../integrations/bitpay-card/bitpay-card-phases/phase-one/phase-one-intro-page/phase-one-intro-page';
import { CoinbasePage } from '../integrations/coinbase/coinbase';
import { BuyCardPage } from '../integrations/gift-cards/buy-card/buy-card';
import { CardCatalogPage } from '../integrations/gift-cards/card-catalog/card-catalog';
import { WalletConnectPage } from '../integrations/wallet-connect/wallet-connect';
import { NewFeaturePage } from '../new-feature/new-feature';
import { AddFundsPage } from '../onboarding/add-funds/add-funds';
import { ScanPage } from '../scan/scan';
import { AmountPage } from '../send/amount/amount';
import { AltCurrencyPage } from '../settings/alt-currency/alt-currency';
import { BitPayIdPage } from '../settings/bitpay-id/bitpay-id';

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
  showWalletConnect: boolean;
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
  public bitPayIdUserInfo: any;
  public accountInitials: string;
  public isCopay: boolean;
  public showSurveyCard: boolean = false;
  public testModeEnabled: boolean;
  private bitPaySurveyCardChecked: boolean = false;
  private user$: Observable<User>;
  private network = Network[this.bitPayIdProvider.getEnvironment().network];
  private hasOldCoinbaseSession: boolean;
  private newReleaseVersion: string;
  private pagesMap: any;
  private newWalletConnectSessionUri: string;
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
    private popupProvider: PopupProvider,
    private iabCardProvider: IABCardProvider,
    private bitPayIdProvider: BitPayIdProvider,
    private walletConnectProvider: WalletConnectProvider,
    private incomingDataProvider: IncomingDataProvider,
    private rateProvider: RateProvider,
    private domProvider: DomProvider,
    private pushNotificationProvider: PushNotificationsProvider,
    private onGoingProcessProvider: OnGoingProcessProvider
  ) {
    this.logger.info('Loaded: HomePage');
    this.isCopay = this.appProvider.info.name === 'copay';
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
    this.user$ = this.iabCardProvider.user$;
    this.user$.subscribe(async user => {
      if (user) {
        this.bitPayIdUserInfo = user;
        this.accountInitials = this.getBitPayIdInitials(user);
      }
    });
    this.persistenceProvider
      .getNetwork()
      .then(network => (this.testModeEnabled = network === 'testnet'));
  }

  private showNewFeatureSlides() {
    if (this.appProvider.isLockModalOpen) return;
    this.events.unsubscribe('Local/showNewFeaturesSlides');
    const disclaimerAccepted = this.profileProvider.profile.disclaimerAccepted;
    const currentVs = `${this.appProvider.version.major}.${this.appProvider.version.minor}.${this.appProvider.version.patch}`;
    const dismissFlag = `dismissed_${currentVs}`;
    if (!disclaimerAccepted) {
      // first time using the App -> don't show
      this.persistenceProvider.setNewFeatureSlidesFlag(
        `dismissed_${currentVs}`
      );
      return;
    }
    this.persistenceProvider.getNewFeatureSlidesFlag().then(value => {
      // if no flag or if current build major minor !== flag major and minor
      if (
        !value ||
        !this.appProvider.meetsMajorMinorVersion(currentVs, value.split('_')[1])
      ) {
        this.newFeatureData.get().then(feature_list => {
          if (feature_list && feature_list.features.length > 0) {
            const modal = this.modalCtrl.create(NewFeaturePage, {
              featureList: feature_list
            });
            modal.present();
            modal.onDidDismiss(data => {
              if (data) {
                if (typeof data.done === 'boolean' && data.done === true) {
                  this.persistenceProvider.setNewFeatureSlidesFlag(dismissFlag);
                }
                if (typeof data.data !== 'boolean') {
                  this.events.publish('IncomingDataRedir', data.data);
                }
              }
            });
          } else {
            this.persistenceProvider.setNewFeatureSlidesFlag(dismissFlag);
          }
        });
      }
    });
  }

  ionViewWillEnter() {
    const config = this.configProvider.get();
    if (this.iabCardProvider.ref) {
      // check for user info
      this.persistenceProvider
        .getBitPayIdUserInfo(this.network)
        .then((user: User) => {
          this.bitPayIdUserInfo = user;
          if (user) {
            this.accountInitials = this.getBitPayIdInitials(user);
          }
        });
    }
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
    this.setMerchantDirectoryAdvertisement();
    this.loadAds();
    this.fetchAdvertisements();
    this.fetchGiftCardAdvertisement();
    this.checkBitPaySurveyCard();
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
      this.checkAltCurrency(); // Check if the alternative currency setted is no longer supported
    }, 2000);
  }

  private loadAds() {
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
                this.showAdvertisements = true;
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
                this.showAdvertisements = true;
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
    this.showAdvertisements = true;
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
      'WalletConnectAdvertisementUpdate',
      (status: 'connected' | 'disconnected') => {
        status === 'connected'
          ? this.removeAdvertisement('walletConnect')
          : this.addWalletConnect();
      }
    );
    this.events.subscribe(
      'CardAdvertisementUpdate',
      ({ status, cards, cardExperimentEnabled }) => {
        const hasGalileo = cards && cards.some(c => c.provider === 'galileo');
        switch (status) {
          case 'disconnected':
            this.addBitPayCard();
            this.removeAdvertisement('card-referral');
            break;
          default:
            if (cardExperimentEnabled) {
              this.cardExperimentEnabled = cardExperimentEnabled;
            }
            if (hasGalileo) {
              this.addCardReferralAdvertisement();
              this.removeAdvertisement('bitpay-card');
            } else {
              this.addBitPayCard();
              this.removeAdvertisement('card-referral');
            }
        }
      }
    );
    this.events.subscribe('Local/TestAdsToggle', testAdsStatus => {
      this.testingAdsEnabled = testAdsStatus;
    });
    this.events.subscribe('Local/ConnectionError', () => {
      this.fetchingStatus = false;
    });
    this.events.subscribe('Local/showNewFeaturesSlides', () => {
      this.showNewFeatureSlides();
    });
    this.events.subscribe(
      'Update/WalletConnectNewSessionRequest',
      newSessionUri => this.onWalletConnectNewSessionRequest(newSessionUri)
    );
    this.events.subscribe('OpenWalletConnect', () =>
      this.goToWalletConnectPage()
    );
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
    this.showWalletConnect = false;
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
          this.addSwapTokensAdvertisement();
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
        case 'newWalletConnect':
          this.showWalletConnect = x.show;
          if (this.showWalletConnect) this.addWalletConnect();
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
    this.showAdvertisements = true;
  }

  private addCardReferralAdvertisement() {
    if (!this.isCordova) return;
    this.persistenceProvider
      .getAdvertisementDismissed('card-referral')
      .then((value: string) => {
        if (value === 'dismissed') {
          return;
        }

        const referral: Advertisement = {
          name: 'card-referral',
          title: this.translate.instant('Get $10'),
          body: this.translate.instant(
            'Refer a friend and get $10 loaded onto your BitPay card.'
          ),
          app: 'bitpay',
          linkText: this.translate.instant('Refer Friend'),
          link: 'card-referral',
          isTesting: false,
          imgSrc: 'assets/img/icon-bpcard.svg',
          dismissible: true
        };
        const alreadyVisible = this.advertisements.find(
          a => a.name === 'card-referral'
        );
        !alreadyVisible && this.advertisements.unshift(referral);
      });
  }

  private addBitPayCard() {
    if (!this.isCordova) return;
    this.persistenceProvider
      .getAdvertisementDismissed('bitpay-card')
      .then((value: string) => {
        if (value === 'dismissed') {
          return;
        }
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
      });
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
    this.showAdvertisements = true;
  }

  private async addWalletConnect() {
    const session = await this.persistenceProvider.getWalletConnect();

    const alreadyVisible = this.advertisements.find(
      a => a.name === 'walletConnect'
    );
    !session &&
      !alreadyVisible &&
      this.advertisements.unshift({
        name: 'walletConnect',
        title: this.translate.instant('Connect to Defi'),
        body: this.translate.instant(
          'Use WalletConnect to access your favorite dApps.'
        ),
        app: 'bitpay',
        linkText: this.translate.instant('Get Started'),
        link: 'wallet-connect-page',
        dismissible: true,
        isTesting: false,
        imgSrc: 'assets/img/wallet-connect/advertisement.svg'
      });
    this.showAdvertisements = true;
  }

  private async addSwapTokensAdvertisement() {
    const alreadyVisible = this.advertisements.find(
      a => a.name === 'swapTokens'
    );
    !alreadyVisible &&
      this.advertisements.unshift({
        name: 'swapTokens',
        title: this.translate.instant('Swap Tokens'),
        body: this.translate.instant('Choose from hundreds of ERC-20 tokens.'),
        app: 'bitpay',
        linkText: this.translate.instant('Get Started'),
        link: 'swap-tokens-page',
        dismissible: true,
        isTesting: false,
        imgSrc: 'assets/img/exchange-crypto/icon-swap.svg'
      });
    this.showAdvertisements = true;
  }

  private async addGiftCardDiscount(discountedCard: CardConfig) {
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
    const isDismissed =
      (await this.checkIfDismissed(advertisementName)) == 'dismissed'
        ? true
        : false;
    !alreadyVisible &&
      !isDismissed &&
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

  private async addGiftCardPromotion(promotedCard: CardConfig) {
    const promo = promotedCard.promotions[0];
    const advertisementName = promo.shortDescription;
    const alreadyVisible = this.advertisements.find(
      a => a.name === advertisementName
    );
    const isDismissed =
      (await this.checkIfDismissed(advertisementName)) == 'dismissed'
        ? true
        : false;
    !alreadyVisible &&
      !isDismissed &&
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

  private checkIfDismissed(name: string): Promise<any> {
    return this.persistenceProvider.getAdvertisementDismissed(name);
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
      this.logger.debug('Add advertisement: ', advertisement.name);
      if (
        advertisement.app &&
        advertisement.app != this.appProvider.info.name
      ) {
        this.removeAdvertisement(advertisement.name);
        this.logger.debug('Removed advertisement: ', advertisement.name);
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
            this.logger.debug('Removed advertisement: ', advertisement.name);
            return;
          }
        });
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
      if (this.advertisements && this.advertisements.length == 0)
        this.showAdvertisements = false;
    }
    if (this.slides) this.slides.slideTo(0, 500);
  }

  public goTo(page, params: any = {}) {
    if (page === 'wallet-connect-page') {
      this.goToWalletConnectPage();
      return;
    }
    if (page === 'swap-tokens-page') {
      this.checkSwapCryptoDisclaimer();
      return;
    }
    if (page === 'card-referral') {
      this.iabCardProvider.loadingWrapper(async () => {
        const cards = await this.persistenceProvider.getBitpayDebitCards(
          this.network
        );
        const { id } = cards.find(c => c.cardType === 'virtual');

        this.iabCardProvider.sendMessage(
          {
            message: `openCardReferralDashboard?${id}`
          },
          () => {
            this.iabCardProvider.show();
          }
        );
      });
      return;
    }

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

  private createInfoSheet(type: InfoSheetType, params?): InfoSheetComponent {
    return this.setupSheet<InfoSheetComponent>(InfoSheetComponent, type, params)
      .instance;
  }

  private setupSheet<T extends ActionSheetParent>(
    componentType: { new (...args): T },
    sheetType?: string,
    params?
  ): ComponentRef<T> {
    const sheet = this.domProvider.appendComponentToBody<T>(componentType);
    sheet.instance.componentRef = sheet;
    sheet.instance.sheetType = sheetType;
    sheet.instance.params = params;
    return sheet;
  }

  public async checkSwapCryptoDisclaimer() {
    const hasAcceptedDisclaimer =
      (await this.persistenceProvider.getSwapCryptoDisclaimer()) === 'accepted';
    if (hasAcceptedDisclaimer) {
      this.goToSwapCryptoPage();
    } else {
      const infoSheet = this.createInfoSheet('exchange-crypto-disclaimer');
      await infoSheet.present();
      infoSheet.onDidDismiss((hasAcceptedDisclaimer: boolean) => {
        if (hasAcceptedDisclaimer) {
          this.persistenceProvider.setSwapCryptoDisclaimer('accepted');
          this.goToSwapCryptoPage();
        }
      });
    }
  }

  private goToSwapCryptoPage() {
    this.analyticsProvider.logEvent('exchange_crypto_button_clicked', {
      from: 'homePage'
    });
    this.navCtrl.push(ExchangeCryptoPage, {
      currency: this.configProvider.get().wallet.settings.alternativeIsoCode
    });
  }

  public goToWalletConnectPage() {
    this.persistenceProvider.getWalletConnect().then(session => {
      session ? this.navCtrl.push(WalletConnectPage) : this.showWallets();
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
          this.testModeEnabled = newNetwork === 'testnet';
          const notificationConfig = {
            title: `Test Mode ${this.testModeEnabled ? 'Enabled' : 'Disabled'}`,
            body: `Network changed to ${
              this.testModeEnabled ? 'testnet' : 'mainnet'
            }. Close and restart the app.`,
            action: 'notifyOnly',
            closeButtonText: ' ',
            autoDismiss: false
          };
          this.pushNotificationProvider.showInappNotification(
            notificationConfig
          );
          this.onGoingProcessProvider.set('Restart the app');
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

  private showInfoSheet(altCurrency): void {
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'unsupported-alt-currency',
      altCurrency
    );
    infoSheet.present();
    infoSheet.onDidDismiss(option => {
      if (option) {
        const settingsTabIndex = this.navCtrl.parent._tabs.length - 1; // The index of SettingsPage tab depends on the platform and distribution
        this.navCtrl.parent.select(settingsTabIndex);
        this.navCtrl.push(AltCurrencyPage);
      }
    });
  }

  private openEmailDisclaimer() {
    const message = this.translate.instant(
      'By providing your email address, you give explicit consent to BitPay to use your email address to send you email notifications about payments.'
    );
    const title = this.translate.instant('Privacy Notice update');
    const okText = this.translate.instant('Accept');
    const cancelText = this.translate.instant('Disable notifications');
    this.popupProvider
      .ionicConfirm(title, message, okText, cancelText)
      .then(ok => {
        if (ok) {
          // Accept new Privacy Notice
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

  private checkAltCurrency(): void {
    const config = this.configProvider.get();
    const altCurrency = {
      name: config.wallet.settings.alternativeName,
      isoCode: config.wallet.settings.alternativeIsoCode
    };
    if (
      !this.rateProvider.isAltCurrencyAvailable(altCurrency.isoCode) &&
      !_.isEmpty(this.rateProvider.alternatives)
    ) {
      this.showInfoSheet(altCurrency);
    }
  }

  public openBitPayIdPage(): void {
    if (this.bitPayIdUserInfo) {
      this.navCtrl.push(BitPayIdPage, this.bitPayIdUserInfo);
    } else {
      this.iabCardProvider.loadingWrapper(() => {
        this.logger.log('settings - pairing');
        this.iabCardProvider.show();
        setTimeout(() => {
          this.iabCardProvider.sendMessage(
            {
              message: 'pairingOnly'
            },
            () => {}
          );
        }, 100);
      });
    }
  }

  private getBitPayIdInitials(user): string {
    const { givenName, familyName } = user;
    return [givenName, familyName]
      .map(name => name && name.charAt(0).toUpperCase())
      .join('');
  }

  private checkBitPaySurveyCard() {
    if (!this.bitPaySurveyCardChecked) {
      this.persistenceProvider.getBitPayCardOrderStarted().then(ts => {
        this.showBitPaySurveyCard(ts);
      });
    }
  }

  private async showBitPaySurveyCard(ts: number) {
    if (!ts || this.bitPaySurveyCardChecked) return;

    this.bitPaySurveyCardChecked = true;
    const cards = await this.persistenceProvider.getBitpayDebitCards(
      this.network
    );
    if (cards.length) return;

    const lastSurveyCardDismissed = await this.persistenceProvider.getBitPaySurveyCardDismissed();
    // show for the first time after 24 hours
    if (
      moment().diff(moment.unix(ts), 'hours') >= 24 &&
      !lastSurveyCardDismissed
    ) {
      this.showSurveyCard = true;
    }

    // show every two weeks until the user gets the card
    if (moment().diff(moment.unix(lastSurveyCardDismissed), 'days') >= 14) {
      this.showSurveyCard = true;
    }
  }

  public dismissBitPaySurveyCard(): void {
    this.logger.debug(`BitPay survey card dismissed`);
    this.showSurveyCard = false;
    const now = moment().unix();
    this.persistenceProvider.setBitPaySurveyCardDismissed(now);
  }

  public openBitPaySurveyLink(): void {
    const url = 'https://payux.typeform.com/to/PbI7b2ZB';
    this.externalLinkProvider.open(url);
  }

  private showWallets(): void {
    const wallets = this.profileProvider.getWallets({
      coin: 'eth',
      onlyComplete: true,
      backedUp: true,
      m: 1,
      n: 1
    });

    const params = {
      wallets,
      selectedWalletId: null,
      title: this.translate.instant('Select a wallet'),
      fromWalletConnect: true
    };
    const walletSelector = this.actionSheetProvider.createWalletSelector(
      params
    );
    walletSelector.present();
    walletSelector.onDidDismiss(wallet => {
      this.onSelectWalletEvent(wallet);
    });
  }

  private async onSelectWalletEvent(wallet): Promise<void> {
    if (!_.isEmpty(wallet)) {
      await this.walletConnectProvider.setAccountInfo(wallet);

      let params: {
        fromWalletConnect: true;
        walletId: string;
        force?: boolean;
        updateURI?: boolean;
      } = {
        fromWalletConnect: true,
        walletId: wallet.credentials.walletId
      };

      if (this.newWalletConnectSessionUri) {
        this.logger.log(
          'WalletConnect - New Session Request URI',
          this.newWalletConnectSessionUri
        );
        const redirParams = {
          ...params,
          force: true
        };
        this.incomingDataProvider.redir(
          this.newWalletConnectSessionUri,
          redirParams
        );
        setTimeout(() => (this.newWalletConnectSessionUri = null));
      } else {
        this.isCordova
          ? this.navCtrl.push(ScanPage, params, { animate: false })
          : this.navCtrl.push(WalletConnectPage, params);
      }
    }
  }

  private onWalletConnectNewSessionRequest(newSession) {
    this.newWalletConnectSessionUri = newSession;
    this.showWallets();
  }
}

function getGiftCardAdvertisementName(discountedCard: CardConfig): string {
  return `${discountedCard.discounts[0].code}-${discountedCard.name}-gift-card-discount`;
}
