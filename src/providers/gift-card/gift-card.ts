import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { Observable, Subject } from 'rxjs';
import { from } from 'rxjs/observable/from';
import { fromPromise } from 'rxjs/observable/fromPromise';
import { of } from 'rxjs/observable/of';
import { mergeMap } from 'rxjs/operators';
import { AmazonProvider } from '../amazon/amazon';
import { Logger } from '../logger/logger';
import { MercadoLibreProvider } from '../mercado-libre/mercado-libre';
import { TimeProvider } from '../time/time';
import {
  CardBrand,
  CardConifg,
  CardName,
  GiftCard,
  LegacyCardServiceName,
  RedeemResponse
} from './gift-card.types';

export { CardBrand, CardConifg, CardName, GiftCard };

@Injectable()
export class GiftCardProvider {
  credentials: {
    NETWORK: string;
    BITPAY_API_URL: string;
  } = {
    NETWORK: 'livenet',
    BITPAY_API_URL: 'https://bitpay.com'
  };

  cardUpdatesSubject: Subject<GiftCard> = new Subject<GiftCard>();
  cardUpdates$: Observable<GiftCard> = this.cardUpdatesSubject.asObservable();

  constructor(
    private amazonProvider: AmazonProvider,
    private http: HttpClient,
    private logger: Logger,
    private mercadoLibreProvider: MercadoLibreProvider,
    private timeProvider: TimeProvider
  ) {
    this.logger.info('GiftCardProvider initialized.');
    this.setCredentials();
  }

  getNetwork() {
    return this.credentials.NETWORK;
  }

  setCredentials() {
    this.credentials.BITPAY_API_URL =
      this.credentials.NETWORK === 'testnet'
        ? 'https://test.bitpay.com'
        : 'https://bitpay.com';
    this.amazonProvider.setCredentials(this.credentials);
    this.mercadoLibreProvider.setCredentials(this.credentials);
  }

  async getCardConfig(cardName: CardName) {
    const supportedCards = await this.getSupportedCards();
    return supportedCards.filter(c => c.name === cardName)[0];
  }

  getCardProvider(cardName: CardName) {
    const providerMap = {
      [CardName.amazon]: this.amazonProvider,
      [CardName.amazonJapan]: this.amazonProvider,
      [CardName.mercadoLibre]: this.mercadoLibreProvider
    };
    return providerMap[cardName];
  }

  async getPurchasedCards(cardName: CardName): Promise<GiftCard[]> {
    const provider = this.getCardProvider(cardName);
    const method = provider.getPurchasedCards.bind(provider);
    const [cards, cardConfig] = await Promise.all([
      method(),
      this.getCardConfig(cardName)
    ]);
    return cards.map(c => ({ ...c, name: cardName, brand: cardConfig.brand }));
  }

  async saveGiftCard(
    gc,
    opts?: Partial<{ error: string; status: string; remove: boolean }>
  ) {
    const provider = this.getCardProvider(gc.name);
    const getCardMap = provider.getCardMap.bind(provider);
    const persistCards = provider.persistCards.bind(provider);
    let oldGiftCards = await getCardMap();
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
    newMap = JSON.stringify(newMap);
    return persistCards(newMap);
  }

  public async createGiftCard(data: GiftCard) {
    const dataSrc = {
      clientId: data.uuid,
      invoiceId: data.invoiceId,
      accessKey: data.accessKey
    };

    const name = data.name;
    const cardConfig = await this.getCardConfig(name);

    const url = `${this.credentials.BITPAY_API_URL}/${
      cardConfig.bitpayApiPath
    }/redeem`;

    return this.http
      .post(url, dataSrc)
      .catch(err => {
        this.logger.error(
          `${cardConfig.name} Gift Card Create/Update: ${err.message}`
        );
        return Observable.throw(err);
      })
      .map((res: RedeemResponse) => {
        const claimCode = res.claimCode || res.pin;
        const status = this.getCardStatus(res);
        const fullCard = { ...res, ...data, name, status, claimCode };
        this.logger.info(
          `${cardConfig.name} Gift Card Create/Update: ${fullCard.status}`
        );
        return fullCard;
      })
      .toPromise();
  }

  getCardStatus(res: RedeemResponse) {
    /* Hope to deprecate this method when we have a standardized redeem endpoint */
    const amazonCardStatus = res.status === 'paid' ? 'PENDING' : res.status;
    const mlCardStatus =
      res.cardStatus === 'active' ? 'SUCCESS' : res.cardStatus;
    return amazonCardStatus || mlCardStatus;
  }

  updatePendingGiftCards(cards: GiftCard[]): Observable<GiftCard> {
    const cardsNeedingUpdate = cards.filter(card =>
      this.checkIfCardNeedsUpdate(card)
    );
    return from(cardsNeedingUpdate).pipe(
      mergeMap(card =>
        fromPromise(this.createGiftCard(card)).catch(err => {
          this.logger.error('Error creating gift card:', err);
          return of({ ...card, status: 'FAILURE' });
        })
      ),
      mergeMap((updatedFields, index) => {
        const card = cardsNeedingUpdate[index];
        return updatedFields.status !== 'PENDING'
          ? this.updatePreviouslyPendingCard(card, updatedFields)
          : of(card);
      })
    );
  }

  updatePreviouslyPendingCard(
    card: GiftCard,
    updatedFields: Partial<GiftCard>
  ) {
    const updatedCard = {
      ...card,
      ...updatedFields
    };
    return fromPromise(
      this.saveGiftCard(updatedCard, {
        remove: updatedFields.status === 'expired'
      })
    ).map(() => {
      this.logger.debug('Amazon gift card updated');
      return updatedCard as GiftCard;
    });
  }

  async archiveCard(card: GiftCard) {
    card.archived = true;
    await this.saveGiftCard(card);
    this.cardUpdatesSubject.next(card);
  }

  async createBitpayInvoice(data) {
    const dataSrc = {
      currency: data.currency,
      amount: data.amount,
      clientId: data.uuid,
      email: data.email,
      buyerSelectedTransactionCurrency: data.buyerSelectedTransactionCurrency
    };
    const config = await this.getCardConfig(data.cardName);
    const url = `${this.credentials.BITPAY_API_URL}/${
      config.bitpayApiPath
    }/pay`;
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
    return cardOrder as { accessKey: string; invoiceId: string };
  }

  public async getBitPayInvoice(id) {
    const res: any = await this.http
      .get(`${this.credentials.BITPAY_API_URL}/invoices/${id}`)
      .toPromise()
      .catch(err => {
        this.logger.error('BitPay Get Invoice: ERROR ' + err.error.message);
        throw err.error.message;
      });
    this.logger.info('BitPay Get Invoice: SUCCESS');
    return res.data;
  }

  private checkIfCardNeedsUpdate(card: GiftCard) {
    // Continues normal flow (update card)
    if (card.status === 'PENDING' || card.status === 'invalid') {
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

  async getSupportedCards() {
    const supportedCurrency = await this.amazonProvider.getSupportedCurrency();
    return this.getOfferedCards().filter(
      card => card.currency === supportedCurrency || card.currency === 'BRL'
    );
  }

  getLegacyServiceNameFromBrand(brand: CardBrand): LegacyCardServiceName {
    /* Transaction custom data currently includes a 'service' key. 
       For now, this method allows us to fetch the value for the service key in views that need it.
       Going forward, we should use 'CardConfig.name' in transaction custom data.
    */
    return {
      [CardBrand.amazon]: LegacyCardServiceName.amazon,
      [CardBrand.mercadoLibre]: LegacyCardServiceName.mercadoLibre
    }[brand];
  }

  getOfferedCards(): CardConifg[] {
    return [
      {
        bitpayApiPath: 'amazon-gift', // Plan to remove bitpayApiPath when the api has a universal gift card enpoint
        brand: CardBrand.amazon,
        currency: 'USD',
        emailRequired: true,
        icon: 'assets/img/amazon/amazon-icon.svg',
        cardImage: 'assets/img/amazon/amazon-gift-card.png',
        maxAmount: 2000,
        minAmount: 1,
        name: CardName.amazon,
        redeemUrl: 'https://www.amazon.com/gc/redeem?claimCode=',
        website: 'amazon.com'
      },
      {
        bitpayApiPath: 'amazon-gift',
        brand: CardBrand.amazon,
        currency: 'JPY',
        emailRequired: true,
        icon: 'assets/img/amazon/amazon-icon.svg',
        cardImage: 'assets/img/amazon/amazon-japan-gift-card.png',
        maxAmount: 200000,
        minAmount: 100,
        name: CardName.amazonJapan,
        redeemUrl: 'https://www.amazon.co.jp/gc/redeem?claimCode=',
        website: 'amazon.co.jp'
      },
      {
        bitpayApiPath: 'mercado-libre-gift',
        brand: CardBrand.mercadoLibre,
        currency: 'BRL',
        emailRequired: false,
        icon: 'assets/img/mercado-libre/mercado-livre-icon.svg',
        cardImage: 'assets/img/mercado-libre/mercado-livre-card.png',
        maxAmount: 2000,
        minAmount: 50,
        name: CardName.mercadoLibre,
        redeemUrl: null,
        website: 'mercadolivre.com.br'
      }
    ];
  }
}
