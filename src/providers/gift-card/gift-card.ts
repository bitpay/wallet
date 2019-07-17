import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ImageLoader } from 'ionic-image-loader';
import * as _ from 'lodash';
import { Observable, Subject } from 'rxjs';
import { from } from 'rxjs/observable/from';
import { fromPromise } from 'rxjs/observable/fromPromise';
import { of } from 'rxjs/observable/of';
import { mergeMap } from 'rxjs/operators';
import { promiseSerial } from '../../utils';
import { AnalyticsProvider } from '../analytics/analytics';
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
  GiftCardSaveParams
} from './gift-card.types';

@Injectable()
export class GiftCardProvider extends InvoiceProvider {
  availableCardsPromise: Promise<CardConfig[]>;
  availableCardMapPromise: Promise<{ [name: string]: CardConfig }>;

  cachedApiCardConfigPromise: Promise<CardConfigMap>;

  cardUpdatesSubject: Subject<GiftCard> = new Subject<GiftCard>();
  cardUpdates$: Observable<GiftCard> = this.cardUpdatesSubject.asObservable();

  public fallbackIcon =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAyCAQAAAA38nkBAAAADklEQVR42mP8/4Vx8CEAn9BhqacD+5kAAAAASUVORK5CYII=';

  constructor(
    private analyticsProvider: AnalyticsProvider,
    private configProvider: ConfigProvider,
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
    this.setCredentials();
  }

  async getCardConfig(cardName: string) {
    const cardConfigMap = await this.getCardConfigMap();
    return cardConfigMap[cardName];
  }

  getCardConfigMap() {
    return this.availableCardMapPromise
      ? this.availableCardMapPromise
      : this.fetchCardConfigMap();
  }

  async fetchCardConfigMap() {
    this.availableCardMapPromise = this.getSupportedCards().then(
      availableCards =>
        availableCards.reduce(
          (map, cardConfig) => ({ ...map, [cardConfig.name]: cardConfig }),
          {}
        )
    );
    return this.availableCardMapPromise;
  }

  async getCardMap(cardName: string) {
    const network = this.getNetwork();
    const map = await this.persistenceProvider.getGiftCards(cardName, network);
    return map || {};
  }

  public async createBitpayInvoice(data) {
    const dataSrc = {
      brand: data.cardName,
      currency: data.currency,
      amount: data.amount,
      clientId: data.uuid,
      discounts: data.discounts,
      email: data.email,
      transactionCurrency: data.buyerSelectedTransactionCurrency
    };
    const url = `${this.getApiPath()}/pay`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    const cardOrder = await this.http
      .post(url, dataSrc, { headers })
      .toPromise()
      .catch(err => {
        this.logger.error('BitPay Create Invoice: ERROR', JSON.stringify(data));
        throw err;
      });
    this.logger.info('BitPay Create Invoice: SUCCESS');
    return cardOrder as {
      accessKey: string;
      invoiceId: string;
      totalDiscount: number;
    };
  }

  async getActiveCards(): Promise<GiftCard[]> {
    const [configMap, giftCardMap] = await Promise.all([
      this.getCardConfigMap(),
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
      this.getCardConfigMap(),
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

  async getPurchasedBrands(): Promise<GiftCard[][]> {
    const supportedCards = await this.getSupportedCards();
    const supportedCardNames = supportedCards.map(c => c.name);
    const purchasedCardPromises = supportedCardNames.map(cardName =>
      this.getPurchasedCards(cardName)
    );
    const purchasedCards = await Promise.all(purchasedCardPromises);
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
    const oldActiveGiftCards: GiftCardMap =
      (await this.persistenceProvider.getActiveGiftCards(this.getNetwork())) ||
      {};
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
    let newMap = oldGiftCards || {};
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

  updatePendingGiftCards(
    cards: GiftCard[],
    force: boolean = false
  ): Observable<GiftCard> {
    const cardsNeedingUpdate = cards.filter(
      card => this.checkIfCardNeedsUpdate(card) || force
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
      this.getAvailableCards().catch(_ => [] as CardConfig[]),
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
    const url = `${this.credentials.BITPAY_API_URL}/gift-cards/cards`;
    const availableCardMap = (await this.http
      .get(url)
      .toPromise()) as AvailableCardMap;
    this.cacheApiCardConfig(availableCardMap);
    return availableCardMap;
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
    return config || {};
  }

  async getAvailableCards(): Promise<CardConfig[]> {
    return this.availableCardsPromise
      ? this.availableCardsPromise
      : this.fetchAvailableCards();
  }

  async fetchAvailableCards(): Promise<CardConfig[]> {
    this.availableCardsPromise = this.fetchAvailableCardMap().then(
      availableCardMap =>
        getCardConfigFromApiConfigMap(
          availableCardMap,
          this.platformProvider.isCordova
        )
          .map(apiCardConfig => ({
            ...apiCardConfig,
            displayName: apiCardConfig.displayName || apiCardConfig.name
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

  getDiscountEventParams(discountedCard: CardConfig, context?: string) {
    const discount = discountedCard.discounts[0];
    return {
      brand: discountedCard.name,
      code: discount.code,
      context,
      percentage: discount.amount
    };
  }

  public register() {
    this.homeIntegrationsProvider.register({
      name: 'giftcards',
      title: 'Gift Cards',
      icon: 'assets/img/gift-cards/gift-cards-icon.svg',
      show: !!this.configProvider.get().showIntegration['giftcards']
    });
  }
}

function getCardConfigFromApiConfigMap(
  availableCardMap: AvailableCardMap,
  isCordova: boolean
) {
  const cardNames = Object.keys(availableCardMap);
  return cardNames
    .filter(
      cardName =>
        availableCardMap[cardName] && availableCardMap[cardName].length
    )
    .map(cardName =>
      getCardConfigFromApiBrandConfig(cardName, availableCardMap[cardName])
    )
    .map(cardConfig => removeDiscountsIfNotMobile(cardConfig, isCordova));
}

function removeDiscountsIfNotMobile(cardConfig: CardConfig, isCordova) {
  return {
    ...cardConfig,
    discounts: isCordova ? cardConfig.discounts : undefined
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

  const { amount, type, maxAmount, minAmount, ...config } = firstCard;
  const baseConfig = { ...config, name: cardName };

  return range
    ? {
        ...baseConfig,
        minAmount: range.minAmount < 1 ? 1 : range.minAmount,
        maxAmount: range.maxAmount
      }
    : { ...baseConfig, supportedAmounts };
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
  a: CardConfig | GiftCard,
  b: CardConfig | GiftCard
) {
  const startsNumeric = value => /^[0-9]$/.test(value.charAt(0));
  const aName = a.displayName.toLowerCase();
  const bName = b.displayName.toLowerCase();
  const aSortValue = `${startsNumeric(aName) ? 'zzz' : ''}${aName}`;
  const bSortValue = `${startsNumeric(bName) ? 'zzz' : ''}${bName}`;
  return aSortValue > bSortValue ? 1 : -1;
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

export function getVisibleDiscount(cardConfig: CardConfig) {
  const discounts = cardConfig.discounts;
  return discounts && discounts.find(d => d.type === 'percentage' && !d.hidden);
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
