import { HttpTestingController } from '@angular/common/http/testing';
import { inject } from '@angular/core/testing';
import { TestUtils } from '../../test';
import { PersistenceProvider } from '../persistence/persistence';
import { GiftCardProvider } from './gift-card';
import { AvailableCardMap, CardBrand, CardName } from './gift-card.types';

describe('GiftCardProvider', () => {
  beforeEach(() => {
    const testBed = TestUtils.configureProviderTestingModule();
    const persistenceProvider: PersistenceProvider = testBed.get(
      PersistenceProvider
    );
    persistenceProvider.load();
  });

  describe('getCardConfig', () => {
    it('should retrieve the correct gift card config values based on card name', inject(
      [GiftCardProvider, HttpTestingController],
      async (
        giftCardProvider: GiftCardProvider,
        httpMock: HttpTestingController
      ) => {
        const promise = giftCardProvider.getCardConfig(CardName.amazon);
        respondWithAvailableCards(httpMock, giftCardProvider);
        const cardConfig = await promise;
        expect(cardConfig.name).toBe(CardName.amazon);
      }
    ));
  });
  describe('getPurchasedCards', () => {
    beforeEach(inject(
      [GiftCardProvider, PersistenceProvider],
      async (giftCardProvider, persistenceProvider) => {
        await saveGiftCards(giftCardProvider, persistenceProvider);
      }
    ));
    // afterEach(inject(
    //   [HttpTestingController],
    //   async (httpMock: HttpTestingController) => httpMock.verify()
    // ));
    it('should return an empty array when the storage key for a brand is unset', inject(
      [GiftCardProvider, HttpTestingController],
      async (
        giftCardProvider: GiftCardProvider,
        httpMock: HttpTestingController
      ) => {
        const promise = giftCardProvider.getPurchasedCards(
          CardName.amazonJapan
        );
        respondWithAvailableCards(httpMock, giftCardProvider);
        const cards = await promise;
        expect(cards).toEqual([]);
      }
    ));
    it('should handle really old gift cards that do not have a currency defined in storage', inject(
      [GiftCardProvider, HttpTestingController],
      async (
        giftCardProvider: GiftCardProvider,
        httpMock: HttpTestingController
      ) => {
        const promise = giftCardProvider.getPurchasedCards(CardName.amazon);
        respondWithAvailableCards(httpMock, giftCardProvider);
        const cards = await promise;
        expect(cards[0].currency).toBe('USD');
      }
    ));
  });
  describe('archiveAllCards', () => {
    beforeEach(inject(
      [GiftCardProvider, PersistenceProvider],
      async (giftCardProvider, persistenceProvider) => {
        await saveGiftCards(giftCardProvider, persistenceProvider);
      }
    ));
    it('should archive all gift cards of a brand', inject(
      [GiftCardProvider, HttpTestingController],
      async (
        giftCardProvider: GiftCardProvider,
        httpMock: HttpTestingController
      ) => {
        const archivePromise = giftCardProvider.archiveAllCards(
          CardName.amazon
        );
        respondWithAvailableCards(httpMock, giftCardProvider);
        await archivePromise;
        const cards = await giftCardProvider.getPurchasedCards(CardName.amazon);
        expect(cards.every(c => c.archived)).toBe(true);
      }
    ));
  });
});

function respondWithAvailableCards(
  httpMock: HttpTestingController,
  giftCardProvider: GiftCardProvider,
  availableCardMap: AvailableCardMap = {
    [CardName.amazon]: [{ currency: 'USD' }]
  } as AvailableCardMap
) {
  httpMock
    .expectOne(
      `${giftCardProvider.credentials.BITPAY_API_URL}/gift-cards/cards`
    )
    .flush(availableCardMap);
}

function saveGiftCards(
  giftCardProvider: GiftCardProvider,
  persistenceProvider: PersistenceProvider
) {
  const baseCard = {
    accessKey: '',
    amount: 100,
    archived: false,
    brand: CardBrand.amazon,
    claimCode: '',
    currency: 'USD',
    date: new Date(),
    invoiceId: '1',
    invoiceUrl: '',
    name: CardName.amazon,
    status: 'SUCCESS',
    uuid: ''
  };
  return persistenceProvider.setGiftCards(
    CardName.amazon,
    giftCardProvider.getNetwork(),
    JSON.stringify([
      {
        ...baseCard
      },
      {
        ...baseCard,
        invoiceId: '2'
      }
    ])
  );
}
