import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';

// Providers
import { AppProvider } from '../../providers/app/app';
import { BwcProvider } from '../../providers/bwc/bwc';
import { ConfigProvider } from '../../providers/config/config';
import { CardConfig } from '../../providers/gift-card/gift-card.types';
import { Logger } from '../../providers/logger/logger';
import { PersistenceProvider } from '../../providers/persistence/persistence';
import { PlatformProvider } from '../../providers/platform/platform';

// Pages
import { BitPayCardIntroPage } from '../../pages/integrations/bitpay-card/bitpay-card-intro/bitpay-card-intro';
import { PhaseOneCardIntro } from '../../pages/integrations/bitpay-card/bitpay-card-phases/phase-one/phase-one-intro-page/phase-one-intro-page';
import { CoinbasePage } from '../../pages/integrations/coinbase/coinbase';
import { BuyCardPage } from '../../pages/integrations/gift-cards/buy-card/buy-card';
import { CardCatalogPage } from '../../pages/integrations/gift-cards/card-catalog/card-catalog';

// Pipes
import { FormatCurrencyPipe } from '../../pipes/format-currency';

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

@Injectable()
export class AdvertisementProvider {
  public ads: Advertisement[] = [];
  public productionAds: Advertisement[] = [];
  public testingAds: Advertisement[] = [];

  private testingAdsEnabled: boolean;
  private currentPlatform: string;
  private currentApp: string;

  private pagesMap = {
    BuyCardPage,
    BitPayCardIntroPage,
    CardCatalogPage,
    CoinbasePage
  };

  constructor(
    private formatCurrencyPipe: FormatCurrencyPipe,
    private appProvider: AppProvider,
    private bwcProvider: BwcProvider,
    private logger: Logger,
    private configProvider: ConfigProvider,
    private translate: TranslateService,
    private persistenceProvider: PersistenceProvider,
    private platformProvider: PlatformProvider
  ) {
    this.logger.debug('AdvertisementProvider initialized');
    this.currentPlatform = this.platformProvider.getPlatform();
    this.currentApp = this.appProvider.info.name;
    this.persistenceProvider
      .getTestingAdvertisments()
      .then(testing => (this.testingAdsEnabled = testing === 'enabled'));
  }

  private isAdsDismissed(name: string): Promise<boolean> {
    return new Promise(resolve => {
      this.persistenceProvider
        .getAdvertisementDismissed(name)
        .then((value: string) => {
          if (value === 'dismissed') resolve(true);
          else resolve(false);
        });
    });
  }

  // TODO
  public isCurrentApp(app: string): boolean {
    return this.currentApp === app;
  }

  private isCurrentPlatform(platform: string): boolean {
    return this.currentPlatform === platform;
  }

  private getGiftCardAdvertisementName(discountedCard: CardConfig): string {
    return `${discountedCard.discounts[0].code}-${discountedCard.name}-gift-card-discount`;
  }

  private getAdPageOrLink(link) {
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

  public async addBitPayCard(cardExperimentEnabled: boolean) {
    // Only mobile
    if (!this.isCurrentPlatform('cordova')) return;

    const advertisementName = 'bitpay-card';
    if (await this.isAdsDismissed(advertisementName)) return;

    const card: Advertisement = cardExperimentEnabled
      ? {
          name: advertisementName,
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
          name: advertisementName,
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
    const alreadyVisible = this.ads.find(a => a.name === advertisementName);
    !alreadyVisible && this.ads.unshift(card);
  }

  public async addGiftCardDiscount(discountedCard: CardConfig) {
    const advertisementName = this.getGiftCardAdvertisementName(discountedCard);
    if (await this.isAdsDismissed(advertisementName)) return;

    const discount = discountedCard.discounts[0];
    const discountText =
      discount.type === 'flatrate'
        ? `${this.formatCurrencyPipe.transform(
            discount.amount,
            discountedCard.currency,
            'minimal'
          )}`
        : `${discount.amount}%`;
    const alreadyVisible = this.ads.find(a => a.name === advertisementName);
    !alreadyVisible &&
      this.ads.unshift({
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

  public async addGiftCardPromotion(promotedCard: CardConfig) {
    const promo = promotedCard.promotions[0];
    const advertisementName = promo.shortDescription;
    if (await this.isAdsDismissed(advertisementName)) return;

    const alreadyVisible = this.ads.find(a => a.name === advertisementName);
    !alreadyVisible &&
      this.ads.unshift({
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

  public async addAmazonGiftCards() {
    const advertisementName = 'amazon-gift-cards';
    if (await this.isAdsDismissed(advertisementName)) return;
    const alreadyVisible = this.ads.find(a => a.name === advertisementName);
    !alreadyVisible &&
      !this.platformProvider.isMacApp() &&
      this.ads.unshift({
        name: advertisementName,
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

  public async addCoinbase() {
    const advertisementName = 'coinbase';
    if (await this.isAdsDismissed(advertisementName)) return;
    const alreadyVisible = this.ads.find(a => a.name === advertisementName);
    !alreadyVisible &&
      this.ads.unshift({
        name: advertisementName,
        title: this.translate.instant('Connect your Coinbase!'),
        body: this.translate.instant('Easily deposit and withdraw funds.'),
        app: 'bitpay',
        linkText: this.translate.instant('Connect Account'),
        link: CoinbasePage,
        dismissible: true,
        isTesting: false,
        imgSrc: 'assets/img/coinbase/coinbase-icon.png'
      });
  }

  public async addMerchantDirectory() {
    const advertisementName = 'merchant-directory';
    if (await this.isAdsDismissed(advertisementName)) return;
    const alreadyVisible = this.ads.find(a => a.name === advertisementName);
    !alreadyVisible &&
      this.ads.push({
        name: advertisementName,
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

  public addDynamicAds() {
    const client = this.bwcProvider.getClient(null, {});

    client.getAdvertisements(
      { testing: this.testingAdsEnabled },
      (err, ads) => {
        if (err) throw err;

        if (this.testingAdsEnabled) {
          _.forEach(ads, async ad => {
            if (await this.isAdsDismissed(ad.name)) return;

            const alreadyVisible = this.testingAds.find(
              a => a.name === ad.name
            );
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
                link: this.getAdPageOrLink(ad.linkUrl),
                imgSrc: ad.imgUrl,
                signature: ad.signature,
                isTesting: ad.isTesting,
                dismissible: true
              });
          });
        } else {
          _.forEach(ads, async ad => {
            if (await this.isAdsDismissed(ad.name)) return;

            const alreadyVisible = this.ads.find(a => a.name === ad.name);
            !alreadyVisible &&
              this.verifySignature(ad) &&
              this.ads.push({
                name: ad.name,
                country: ad.country,
                advertisementId: ad.advertisementId,
                title: ad.title,
                body: ad.body,
                app: ad.app,
                linkText: ad.linkText,
                link: this.getAdPageOrLink(ad.linkUrl),
                imgSrc: ad.imgUrl,
                signature: ad.signature,
                isTesting: ad.isTesting,
                dismissible: true
              });
          });
        }
      }
    );
  }

  /*
  private fetch(): void {
    this.ads.forEach(advertisement => {
      if (
        advertisement.app &&
        advertisement.app != this.appProvider.info.name
      ) {
        this.remove(advertisement.name);
        return;
      }
      this.persistenceProvider
        .getAdvertisementDismissed(advertisement.name)
        .then((value: string) => {
          if (
            value === 'dismissed' ||
            (!this.showCoinbase && advertisement.name == 'coinbase')
          ) {
            this.remove(advertisement.name);
            return;
          }
        });
      this.logger.debug('fetchAdvertisements');
    });
  }
 */

  public remove(name): void {
    if (this.testingAdsEnabled) {
      this.testingAds = _.filter(this.testingAds, adv => adv.name !== name);
    } else {
      this.ads = _.filter(this.ads, adv => adv.name !== name);
    }
  }
}
