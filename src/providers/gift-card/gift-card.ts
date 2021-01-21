import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Events } from 'ionic-angular';
import { ImageLoader } from 'ionic-image-loader';
import * as _ from 'lodash';
import { Observable, Subject } from 'rxjs';
import { from } from 'rxjs/observable/from';
import { fromPromise } from 'rxjs/observable/fromPromise';
import { of } from 'rxjs/observable/of';
import { timer } from 'rxjs/observable/timer';
import { mergeMap } from 'rxjs/operators';
import { promiseSerial } from '../../utils';
import { AnalyticsProvider } from '../analytics/analytics';
import { AppProvider } from '../app/app';
import { BitPayIdProvider } from '../bitpay-id/bitpay-id';
import { ConfigProvider } from '../config/config';
import { EmailNotificationsProvider } from '../email-notifications/email-notifications';
import { HomeIntegrationsProvider } from '../home-integrations/home-integrations';
import { InvoiceProvider } from '../invoice/invoice';
import { Logger } from '../logger/logger';
import {
  GiftCardMap,
  Network,
  PersistenceProvider
} from '../persistence/persistence';
import { PlatformProvider } from '../platform/platform';
import { TimeProvider } from '../time/time';
import {
  ApiCardConfig,
  AvailableCardMap,
  CardConfig,
  CardConfigMap,
  GiftCard,
  GiftCardActivationFee,
  GiftCardDiscount,
  GiftCardPromotion,
  GiftCardSaveParams
} from './gift-card.types';

@Injectable()
export class GiftCardProvider extends InvoiceProvider {
  countryPromise: Promise<string>;
  availableCardsPromise: Promise<CardConfig[]>;
  supportedCardMapPromise: Promise<{ [name: string]: CardConfig }>;

  cachedApiCardConfigPromise: Promise<CardConfigMap>;
  cardUpdatesSubject: Subject<GiftCard> = new Subject<GiftCard>();
  cardUpdates$: Observable<GiftCard> = this.cardUpdatesSubject.asObservable();

  public fallbackIcon =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAyCAQAAAA38nkBAAAADklEQVR42mP8/4Vx8CEAn9BhqacD+5kAAAAASUVORK5CYII=';

  constructor(
    private analyticsProvider: AnalyticsProvider,
    private appProvider: AppProvider,
    private bitpayIdProvider: BitPayIdProvider,
    private configProvider: ConfigProvider,
    private events: Events,
    private imageLoader: ImageLoader,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private timeProvider: TimeProvider,
    public emailNotificationsProvider: EmailNotificationsProvider,
    public http: HttpClient,
    public logger: Logger,
    public persistenceProvider: PersistenceProvider,
    private platformProvider: PlatformProvider
  ) {
    super(emailNotificationsProvider, http, logger, persistenceProvider);
    this.logger.debug('GiftCardProvider initialized');
    this.listenForAuthChanges();
  }

  listenForAuthChanges() {
    this.events.subscribe('BitPayId/Connected', async () => {
      await this.persistenceProvider.setBitPayIdSettings(this.getNetwork(), {
        syncGiftCardPurchases: true
      });
      await timer(1000).toPromise();
      await this.getSupportedCardConfigMap(true);
    });
    this.events.subscribe('BitPayId/Disconnected', async () => {
      await this.getSupportedCardConfigMap(true);
    });
    this.events.subscribe('BitPayId/SettingsChanged', async () => {
      await this.getSupportedCardConfigMap(true);
    });
  }

  async getCardConfig(cardName: string) {
    const cardConfigMap = await this.getSupportedCardConfigMap();
    return cardConfigMap[cardName];
  }

  getSupportedCardConfigMap(bustCache: boolean = false) {
    if (bustCache) {
      this.clearCardConfigCache();
    }
    return this.supportedCardMapPromise
      ? this.supportedCardMapPromise
      : this.fetchCardConfigMap();
  }

  clearCardConfigCache() {
    this.supportedCardMapPromise = undefined;
    this.availableCardsPromise = undefined;
  }

  async fetchCardConfigMap() {
    this.supportedCardMapPromise = this.getSupportedCards().then(
      availableCards =>
        availableCards.reduce(
          (map, cardConfig) => ({ ...map, [cardConfig.name]: cardConfig }),
          {}
        )
    );
    return this.supportedCardMapPromise;
  }

  async getCardMap(cardName: string) {
    const network = this.getNetwork();
    const map = await this.persistenceProvider.getGiftCards(cardName, network);
    return map || {};
  }

  public async shouldSyncGiftCardPurchasesWithBitPayId() {
    const [user, userSettings] = await Promise.all([
      this.persistenceProvider.getBitPayIdUserInfo(this.getNetwork()),
      this.persistenceProvider.getBitPayIdSettings(this.getNetwork())
    ]);
    return user && userSettings && userSettings.syncGiftCardPurchases;
  }

  public getUserEmail(): Promise<string> {
    const getBitPayIdInfo = this.persistenceProvider.getBitPayIdUserInfo(
      this.getNetwork()
    );
    const getGiftCardUserInfo = this.persistenceProvider.getGiftCardUserInfo();
    const shouldSync = this.shouldSyncGiftCardPurchasesWithBitPayId();
    return Promise.all([shouldSync, getBitPayIdInfo, getGiftCardUserInfo])
      .then(([shouldSync, ...rest]) => {
        const [bitpayIdEmail, giftCardEmail] = rest
          .map(result => (_.isString(result) ? JSON.parse(result) : result))
          .map(jsonResult => jsonResult && jsonResult.email);
        return (
          (shouldSync && bitpayIdEmail) ||
          giftCardEmail ||
          this.emailNotificationsProvider.getEmailIfEnabled()
        );
      })
      .catch(_ => {});
  }

  public async createBitpayInvoice(data, attempt: number = 1) {
    this.logger.info('BitPay Creating Invoice: try... ' + attempt);
    const params = {
      brand: data.cardName,
      currency: data.currency,
      amount: data.amount,
      clientId: data.uuid,
      discounts: data.discounts,
      email: data.email,
      phone: data.phone
    };
    const shouldSync = await this.shouldSyncGiftCardPurchasesWithBitPayId();
    const promise = shouldSync
      ? this.createAuthenticatedBitpayInvoice.bind(this)
      : this.createUnauthenticatedBitpayInvoice.bind(this);

    const cardOrder = await promise(params).catch(async err => {
      this.logger.error('BitPay Create Invoice: ERROR', JSON.stringify(err));
      if (attempt <= 5 && err.status == 403) {
        await new Promise(resolve => setTimeout(resolve, 3000 * attempt));
        return this.createBitpayInvoice(data, ++attempt);
      } else throw err;
    });
    this.logger.info('BitPay Create Invoice: SUCCESS');
    return cardOrder as {
      accessKey: string;
      invoiceId: string;
      totalDiscount: number;
    };
  }

  public async createUnauthenticatedBitpayInvoice(params) {
    const url = `${this.getApiPath()}/pay`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post(url, params, { headers }).toPromise();
  }

  public async createAuthenticatedBitpayInvoice(params) {
    const user = await this.persistenceProvider.getBitPayIdUserInfo(
      this.getNetwork()
    );
    return this.bitpayIdProvider.apiCall('createGiftCardInvoice', {
      ...params,
      email: user.email
    });
  }

  async getActiveCards(): Promise<GiftCard[]> {
    const [configMap, giftCardMap] = await Promise.all([
      this.getSupportedCardConfigMap(),
      this.persistenceProvider.getActiveGiftCards(this.getNetwork())
    ]);
    const validSchema =
      giftCardMap && Object.keys(giftCardMap).every(key => key !== 'undefined');
    return !giftCardMap || !validSchema
      ? this.migrateAndFetchActiveCards()
      : getCardsFromInvoiceMap(giftCardMap, configMap);
  }

  async getPurchasedCards(cardName: string): Promise<GiftCard[]> {
    const [configMap, giftCardMap] = await Promise.all([
      this.getSupportedCardConfigMap(),
      this.getCardMap(cardName)
    ]);
    return getCardsFromInvoiceMap(giftCardMap, configMap);
  }

  async hideDiscountItem() {
    return this.persistenceProvider.setHideGiftCardDiscountItem(true);
  }

  async getAllCardsOfBrand(cardBrand: string): Promise<GiftCard[]> {
    const supportedCards = await this.getSupportedCards();
    const cardConfigs = supportedCards.filter(
      cardConfig => cardConfig.displayName === cardBrand
    );
    const cardPromises = cardConfigs.map(cardConfig =>
      this.getPurchasedCards(cardConfig.name)
    );
    const cardsGroup = await Promise.all(cardPromises);
    return cardsGroup
      .reduce((allCards, brandCards) => allCards.concat(brandCards), [])
      .sort(sortByDescendingDate);
  }

  async getRecentlyPurchasedBrandNames(): Promise<string[]> {
    const purchasedBrands: any = await Promise.race([
      this.getPurchasedBrands(),
      Observable.timer(3000)
        .toPromise()
        .then(() => {
          this.logger.debug('Purchased brands took longer than 3s to load');
          return [];
        })
    ]);
    this.logger.debug('got purchased brands');
    const recentlyPurchasedBrands = purchasedBrands
      .map(cards => cards.sort(sortByDescendingDate))
      .sort((a, b) => sortByDescendingDate(a[0], b[0]));
    return recentlyPurchasedBrands
      .map(brandCards => brandCards[0].displayName)
      .slice(0, 6);
  }

  async getPurchasedBrands(): Promise<GiftCard[][]> {
    const supportedCards = await this.getSupportedCards();
    this.logger.debug('got supportedCards in getPurchasedBrands');
    const supportedCardNames = supportedCards.map(c => c.name);
    const purchasedCardPromises = supportedCardNames.map(cardName =>
      this.getPurchasedCards(cardName)
    );
    const purchasedCards = await Promise.all(purchasedCardPromises);
    this.logger.debug('got purchasedCards in getPurchasedBrands');
    return purchasedCards
      .filter(brand => brand.length)
      .sort((a, b) => sortByDisplayName(a[0], b[0]));
  }

  async saveCard(giftCard: GiftCard, opts?: GiftCardSaveParams) {
    const oldGiftCards = await this.getCardMap(giftCard.name);
    const newMap = this.getNewSaveableGiftCardMap(oldGiftCards, giftCard, opts);
    const savePromise = this.persistCards(giftCard.name, newMap);
    await Promise.all([savePromise, this.updateActiveCards([giftCard], opts)]);
  }

  async updateActiveCards(
    giftCardsToUpdate: GiftCard[],
    opts: GiftCardSaveParams = {}
  ) {
    let oldActiveGiftCards: GiftCardMap =
      (await this.persistenceProvider.getActiveGiftCards(this.getNetwork())) ||
      {};
    if (typeof oldActiveGiftCards !== 'object') {
      oldActiveGiftCards = {};
    }
    const newMap = giftCardsToUpdate.reduce(
      (updatedMap, c) =>
        this.getNewSaveableGiftCardMap(updatedMap, c, {
          remove: c.archived || opts.remove
        }),
      oldActiveGiftCards
    );
    return this.persistenceProvider.setActiveGiftCards(
      this.getNetwork(),
      JSON.stringify(newMap)
    );
  }

  clearActiveGiftCards() {
    return this.persistenceProvider.setActiveGiftCards(
      this.getNetwork(),
      JSON.stringify({})
    );
  }

  persistCards(cardName: string, newMap: GiftCardMap) {
    return this.persistenceProvider.setGiftCards(
      cardName,
      this.getNetwork(),
      JSON.stringify(newMap)
    );
  }

  async saveGiftCard(giftCard: GiftCard, opts?: GiftCardSaveParams) {
    const originalCard = (await this.getPurchasedCards(giftCard.name)).find(
      c => c.invoiceId === giftCard.invoiceId
    );
    const cardChanged =
      !originalCard ||
      originalCard.status !== giftCard.status ||
      originalCard.archived !== giftCard.archived ||
      originalCard.barcodeImage !== giftCard.barcodeImage;
    const shouldNotify = cardChanged && giftCard.status !== 'UNREDEEMED';
    await this.saveCard(giftCard, opts);
    shouldNotify && this.cardUpdatesSubject.next(giftCard);
  }

  getNewSaveableGiftCardMap(oldGiftCards, gc, opts?): GiftCardMap {
    if (_.isString(oldGiftCards)) {
      oldGiftCards = JSON.parse(oldGiftCards);
    }
    if (_.isString(gc)) {
      gc = JSON.parse(gc);
    }
    const isValidMap = gcMap =>
      Object.keys(gcMap || {}).every(
        invoiceId => invoiceId.length > 15 && oldGiftCards[invoiceId].currency
      );
    let newMap = isValidMap(oldGiftCards) ? oldGiftCards : {};
    newMap[gc.invoiceId] = gc;
    if (opts && (opts.error || opts.status)) {
      newMap[gc.invoiceId] = _.assign(newMap[gc.invoiceId], opts);
    }
    if (opts && opts.remove) {
      delete newMap[gc.invoiceId];
    }
    return newMap;
  }

  async archiveCard(card: GiftCard) {
    card.archived = true;
    await this.saveGiftCard(card);
  }

  async unarchiveCard(card: GiftCard) {
    card.archived = false;
    await this.saveGiftCard(card);
  }

  async archiveAllCards(cardName: string) {
    const activeCards = (await this.getPurchasedCards(cardName)).filter(
      c => !c.archived
    );
    const oldGiftCards = await this.getCardMap(cardName);
    const invoiceIds = Object.keys(oldGiftCards);
    const newMap = invoiceIds.reduce((newMap, invoiceId) => {
      const card = oldGiftCards[invoiceId];
      card.archived = true;
      return this.getNewSaveableGiftCardMap(newMap, card);
    }, oldGiftCards);
    await Promise.all([
      this.persistCards(cardName, newMap),
      this.updateActiveCards(activeCards.map(c => ({ ...c, archived: true })))
    ]);
    activeCards
      .map(c => ({ ...c, archived: true }))
      .forEach(c => this.cardUpdatesSubject.next(c));
  }

  public async createGiftCard(data: GiftCard) {
    const dataSrc = {
      brand: data.name,
      clientId: data.uuid,
      invoiceId: data.invoiceId,
      accessKey: data.accessKey
    };

    const name = data.name;
    const cardConfig = await this.getCardConfig(name);

    const url = `${this.getApiPath()}/redeem`;

    return this.http
      .post(url, dataSrc)
      .catch(err => {
        this.logger.error(
          `${cardConfig.name} Gift Card Create/Update: ${err.message}`
        );
        const errMessage = err.error && err.error.message;
        const pendingMessages = [
          'Card creation delayed',
          'Invoice is unpaid or payment has not confirmed'
        ];
        return pendingMessages.indexOf(errMessage) > -1 ||
          errMessage.indexOf('Please wait') > -1
          ? of({ ...data, status: 'PENDING' })
          : Observable.throw(err);
      })
      .map(
        (res: {
          claimCode?: string;
          claimLink?: string;
          pin?: string;
          barcodeImage?: string;
        }) => {
          const status = res.claimCode || res.claimLink ? 'SUCCESS' : 'PENDING';
          const fullCard = {
            ...data,
            ...res,
            name,
            status
          };
          this.logger.info(
            `${cardConfig.name} Gift Card Create/Update: ${fullCard.status}`
          );
          return fullCard;
        }
      )
      .toPromise();
  }

  updatePendingGiftCards(cards: GiftCard[]): Observable<GiftCard> {
    const cardsNeedingUpdate = cards.filter(card =>
      this.checkIfCardNeedsUpdate(card)
    );
    return from(cardsNeedingUpdate).pipe(
      mergeMap(card =>
        fromPromise(this.createGiftCard(card)).catch(err => {
          this.logger.error('Error creating gift card:', err);
          this.logger.error('Gift card: ', JSON.stringify(card, null, 4));
          return of({ ...card, status: 'FAILURE' });
        })
      ),
      mergeMap(card =>
        card.status === 'UNREDEEMED' || card.status === 'PENDING'
          ? fromPromise(
              this.getBitPayInvoice(card.invoiceId).then(invoice => ({
                ...card,
                status:
                  (card.status === 'PENDING' ||
                    (card.status === 'UNREDEEMED' &&
                      invoice.status !== 'new')) &&
                  invoice.status !== 'expired' &&
                  invoice.status !== 'invalid'
                    ? 'PENDING'
                    : 'expired'
              }))
            )
          : of(card)
      ),
      mergeMap(updatedCard => this.updatePreviouslyPendingCard(updatedCard)),
      mergeMap(updatedCard => {
        this.logger.debug('Gift card updated');
        return of(updatedCard);
      })
    );
  }

  updatePreviouslyPendingCard(updatedCard: GiftCard) {
    return fromPromise(
      this.saveGiftCard(updatedCard, {
        remove: updatedCard.status === 'expired'
      }).then(() => updatedCard)
    );
  }

  private checkIfCardNeedsUpdate(card: GiftCard) {
    if (!card.invoiceId) {
      return false;
    }
    // Continues normal flow (update card)
    if (
      card.status === 'PENDING' ||
      card.status === 'UNREDEEMED' ||
      card.status === 'invalid' ||
      (!card.claimCode && !card.claimLink)
    ) {
      return true;
    }
    // Check if card status FAILURE for 24 hours
    if (
      card.status === 'FAILURE' &&
      this.timeProvider.withinPastDay(card.date)
    ) {
      return true;
    }
    // Success: do not update
    return false;
  }

  async getSupportedCards(): Promise<CardConfig[]> {
    const [availableCards, cachedApiCardConfig] = await Promise.all([
      this.getAvailableCards().catch(err => {
        this.logger.error(
          'Error calling getAvailableCards in getSupportedCards',
          err
        );
        this.clearCardConfigCache();
        return [] as CardConfig[];
      }),
      this.getCachedApiCardConfig().catch(_ => ({} as CardConfigMap))
    ]);
    const cachedCardNames = Object.keys(cachedApiCardConfig);
    const availableCardNames = availableCards.map(c => c.name);
    const uniqueCardNames = Array.from(
      new Set([...availableCardNames, ...cachedCardNames])
    );
    const supportedCards = uniqueCardNames
      .map(cardName => {
        const freshConfig = availableCards.find(c => c.name === cardName);
        const cachedConfig = appendFallbackImages(
          cachedApiCardConfig[cardName]
        );
        const config = freshConfig || cachedConfig;
        const displayName = config.displayName || config.brand || config.name;
        return {
          ...config,
          displayName
        } as CardConfig;
      })
      .filter(filterDisplayableConfig)
      .sort(sortByDisplayName);
    return supportedCards;
  }

  async getSupportedCardMap(): Promise<CardConfigMap> {
    const supportedCards = await this.getSupportedCards();
    return supportedCards.reduce(
      (map, cardConfig) => ({
        ...map,
        [cardConfig.name]: cardConfig
      }),
      {}
    );
  }

  async migrateAndFetchActiveCards(): Promise<GiftCard[]> {
    await this.clearActiveGiftCards();
    const purchasedBrands = await this.getPurchasedBrands();
    const activeCardsGroupedByBrand = purchasedBrands.filter(
      cards => cards.filter(c => !c.archived).length
    );
    const activeCards = activeCardsGroupedByBrand
      .reduce(
        (allCards, brandCards) => [...allCards, ...brandCards],
        [] as GiftCard[]
      )
      .filter(c => !c.archived);
    await this.updateActiveCards(activeCards);
    return activeCards;
  }

  async fetchAvailableCardMap() {
    const shouldSync = await this.shouldSyncGiftCardPurchasesWithBitPayId();
    const availableCardMap = shouldSync
      ? await this.fetchAuthenticatedAvailableCardMap()
      : await this.fetchPublicAvailableCardMap();
    this.cacheApiCardConfig(availableCardMap);
    this.logger.debug(
      'fetched available card map',
      shouldSync ? 'synced' : 'unsynced'
    );
    return availableCardMap;
  }

  async fetchPublicAvailableCardMap(): Promise<AvailableCardMap> {
    const url = `${this.credentials.BITPAY_API_URL}/gift-cards/cards`;
    return this.http
      .get(url, {
        headers: {
          'x-bitpay-version': this.appProvider.info.version
        }
      })
      .toPromise() as Promise<AvailableCardMap>;
  }

  async fetchAuthenticatedAvailableCardMap(): Promise<AvailableCardMap> {
    return this.bitpayIdProvider.apiCall('getGiftCardCatalog', {
      bitpayVersion: this.appProvider.info.version
    });
  }

  async cacheApiCardConfig(availableCardMap: AvailableCardMap) {
    const cardNames = Object.keys(availableCardMap);
    const previousCache = await this.persistenceProvider.getGiftCardConfigCache(
      this.getNetwork()
    );
    const apiCardConfigCache = getCardConfigFromApiConfigMap(
      availableCardMap,
      this.platformProvider.isCordova
    ).reduce((configMap, apiCardConfigMap, index) => {
      const name = cardNames[index];
      return { ...configMap, [name]: apiCardConfigMap };
    }, {});
    const newCache = {
      ...previousCache,
      ...apiCardConfigCache
    };
    if (JSON.stringify(previousCache) !== JSON.stringify(newCache)) {
      await this.persistenceProvider.setGiftCardConfigCache(
        this.getNetwork(),
        newCache
      );
    }
  }

  async fetchCachedApiCardConfig(): Promise<CardConfigMap> {
    this.cachedApiCardConfigPromise = this.persistenceProvider.getGiftCardConfigCache(
      this.getNetwork()
    );
    return this.cachedApiCardConfigPromise;
  }

  async getCachedApiCardConfig(): Promise<CardConfigMap> {
    const config = this.cachedApiCardConfigPromise
      ? await this.cachedApiCardConfigPromise
      : await this.fetchCachedApiCardConfig();
    this.logger.debug('got cached api card config');
    return config || {};
  }

  async savePhone(
    phone: string,
    phoneCountryInfo: { phoneCountryCode: string; countryIsoCode: string }
  ): Promise<void> {
    await Promise.all([
      this.persistenceProvider.setPhone(phone),
      this.persistenceProvider.setPhoneCountryInfo(phoneCountryInfo)
    ]);
  }

  async getPhoneAndCountryCode(): Promise<{
    phone: string;
    phoneCountryInfo;
  }> {
    const [phone, phoneCountryInfo] = await Promise.all([
      this.persistenceProvider.getPhone(),
      this.persistenceProvider.getPhoneCountryInfo()
    ]);
    return {
      phone: phone && `${phone}`,
      phoneCountryInfo: phoneCountryInfo || {
        phoneCountryCode: '',
        countryIsoCode: ''
      }
    };
  }

  async getCountry(): Promise<string> {
    this.countryPromise = this.countryPromise
      ? this.countryPromise
      : this.http
          .get('https://bitpay.com/wallet-card/location')
          .map((res: { country: string }) => res.country)
          .toPromise()
          .catch(_ => 'US');
    return this.countryPromise;
  }

  async getAvailableCards(): Promise<CardConfig[]> {
    return this.availableCardsPromise
      ? this.availableCardsPromise
      : this.fetchAvailableCards();
  }

  async fetchAvailableCards(): Promise<CardConfig[]> {
    this.availableCardsPromise = Promise.all([
      this.fetchAvailableCardMap()
    ]).then(([availableCardMap]) =>
      getCardConfigFromApiConfigMap(
        availableCardMap,
        this.platformProvider.isCordova
      )
        .map(apiCardConfig => ({
          ...apiCardConfig,
          displayName: apiCardConfig.displayName || apiCardConfig.name,
          tags: apiCardConfig.tags || []
        }))
        .filter(filterDisplayableConfig)
        .sort(sortByDisplayName)
    );
    return this.availableCardsPromise;
  }

  public async preloadImages(): Promise<void> {
    const supportedCards = await this.getSupportedCards();
    const imagesPerCard = supportedCards
      .map(c => [c.icon, c.cardImage])
      .filter(images => images[0] && images[1]);
    const fetchBatches = imagesPerCard.map(images => async () =>
      Promise.all(images.map(i => this.imageLoader.preload(i)))
    );
    await promiseSerial(fetchBatches);
  }

  logEvent(eventName: string, eventParams: { [key: string]: any }) {
    if (this.getNetwork() !== Network.livenet) return;
    this.analyticsProvider.logEvent(eventName, eventParams);
  }

  getPromoEventParams(promotedCard: CardConfig, context?: string) {
    const discount = promotedCard.discounts && promotedCard.discounts[0];
    const promo = promotedCard.promotions && promotedCard.promotions[0];
    return {
      brand: promotedCard.name,
      name: (discount && discount.code) || promo.shortDescription,
      context,
      type: (discount && discount.type) || 'promo',
      ...(discount && { discountAmount: discount && discount.amount })
    };
  }

  public register() {
    this.homeIntegrationsProvider.register({
      name: 'giftcards',
      title: 'Gift Cards',
      icon: 'assets/img/gift-cards/gift-cards-icon.svg',
      show: !!this.configProvider.get().showIntegration['giftcards'],
      type: 'card'
    });
  }
}

function getCardConfigFromApiConfigMap(
  availableCardMap: AvailableCardMap,
  isCordova: boolean
): CardConfig[] {
  const cardNames = Object.keys(availableCardMap);
  const availableCards = cardNames
    .filter(
      cardName =>
        availableCardMap[cardName] && availableCardMap[cardName].length
    )
    .map(cardName =>
      getCardConfigFromApiBrandConfig(cardName, availableCardMap[cardName])
    )
    .map(cardConfig => removeDiscountsIfNotMobile(cardConfig, isCordova));
  return availableCards;
}

function removeDiscountsIfNotMobile(cardConfig: CardConfig, isCordova) {
  return {
    ...cardConfig,
    discounts: isCordova ? cardConfig.discounts : undefined,
    promotions: isCordova ? cardConfig.promotions : undefined
  };
}

function getCardConfigFromApiBrandConfig(
  cardName: string,
  apiBrandConfig: ApiCardConfig
): CardConfig {
  const cards = apiBrandConfig;
  const [firstCard] = cards;
  const { currency } = firstCard;
  const range = cards.find(
    c => !!(c.maxAmount || c.minAmount) && c.currency === currency
  );
  const fixed = cards.filter(c => c.amount && c.currency);
  const supportedAmounts = fixed
    .reduce(
      (newSupportedAmounts, currentCard) => [
        ...newSupportedAmounts,
        currentCard.amount
      ],
      []
    )
    .sort((a, b) => a - b);

  const activationFees = cards
    .filter(c => c.activationFees)
    .reduce(
      (allFees, card) => allFees.concat(card.activationFees),
      [] as GiftCardActivationFee[]
    );
  const { amount, type, maxAmount, minAmount, ...config } = firstCard;
  const baseConfig = { ...config, name: cardName, activationFees };

  return range
    ? {
        ...baseConfig,
        minAmount: range.minAmount < 1 ? 1 : range.minAmount,
        maxAmount: range.maxAmount
      }
    : { ...baseConfig, supportedAmounts };
}

export function getActivationFee(
  amount: number,
  cardConfig: CardConfig
): number {
  const activationFees = (cardConfig && cardConfig.activationFees) || [];
  const fixedFee = activationFees.find(
    fee =>
      fee.type === 'fixed' &&
      amount >= fee.amountRange.min &&
      amount <= fee.amountRange.max
  );
  return (fixedFee && fixedFee.fee) || 0;
}

export function filterDisplayableConfig(cardConfig: CardConfig) {
  return (
    cardConfig.logo &&
    cardConfig.icon &&
    cardConfig.cardImage &&
    !cardConfig.hidden
  );
}

export function sortByDescendingDate(a: GiftCard, b: GiftCard) {
  return a.date < b.date ? 1 : -1;
}

export function sortByDisplayName(
  a: { displayName: string },
  b: { displayName: string }
) {
  const aSortValue = getDisplayNameSortValue(a.displayName);
  const bSortValue = getDisplayNameSortValue(b.displayName);
  return aSortValue > bSortValue ? 1 : -1;
}

export function getDisplayNameSortValue(displayName: string) {
  const startsNumeric = value => /^[0-9]$/.test(value.charAt(0));
  const name = displayName.toLowerCase();
  return `${startsNumeric(name) ? 'zzz' : ''}${name}`;
}

export function setNullableCardFields(card: GiftCard, cardConfig: CardConfig) {
  return {
    ...card,
    name: cardConfig.name,
    displayName: cardConfig.displayName,
    currency: card.currency || getCurrencyFromLegacySavedCard(cardConfig.name)
  };
}

export function getCardsFromInvoiceMap(
  invoiceMap: {
    [invoiceId: string]: GiftCard;
  },
  configMap: CardConfigMap
): GiftCard[] {
  return Object.keys(invoiceMap)
    .map(invoiceId => invoiceMap[invoiceId] as GiftCard)
    .filter(card => card.invoiceId && configMap[card.name])
    .map(card => setNullableCardFields(card, configMap[card.name]))
    .sort(sortByDescendingDate);
}

export function hasVisibleDiscount(cardConfig: CardConfig) {
  return !!getVisibleDiscount(cardConfig);
}

export function hasPromotion(cardConfig: CardConfig) {
  return !!(cardConfig.promotions && cardConfig.promotions[0]);
}

export function getPromo(
  cardConfig: CardConfig
): GiftCardDiscount | GiftCardPromotion {
  return (
    getVisibleDiscount(cardConfig) ||
    (cardConfig.promotions && cardConfig.promotions[0])
  );
}

export function getVisibleDiscount(cardConfig: CardConfig) {
  const discounts = cardConfig.discounts;
  const supportedDiscountTypes = ['flatrate', 'percentage'];
  return (
    discounts &&
    discounts.find(d => supportedDiscountTypes.includes(d.type) && !d.hidden)
  );
}

function appendFallbackImages(cardConfig: CardConfig) {
  // For cards bought outside of the user's current IP catalog area before server-side
  // catalog management was implemented and card images were stored locally.
  const getBrandImagePath = brandName => {
    const cardImagePath = `https://bitpay.com/gift-cards/assets/`;
    const brandImageDirectory = brandName
      .toLowerCase()
      .replace(/[^0-9a-z]/gi, '');
    return `${cardImagePath}${brandImageDirectory}/`;
  };
  const getImagesForBrand = brandName => {
    const imagePath = getBrandImagePath(brandName);
    return {
      cardImage: `${imagePath}card.png`,
      icon: `${imagePath}icon.svg`,
      logo: `${imagePath}logo.svg`
    };
  };
  const needsFallback =
    cardConfig &&
    cardConfig.cardImage &&
    !cardConfig.cardImage.includes('https://bitpay.com');
  return needsFallback
    ? { ...cardConfig, ...getImagesForBrand(cardConfig.name) }
    : cardConfig;
}

function getCurrencyFromLegacySavedCard(
  cardName: string
): 'USD' | 'JPY' | 'BRL' {
  switch (cardName) {
    case 'Amazon.com':
      return 'USD';
    case 'Amazon.co.jp':
      return 'JPY';
    case 'Mercado Livre':
      return 'BRL';
    default:
      return 'USD';
  }
}
