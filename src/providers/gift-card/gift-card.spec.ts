import { HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, inject } from '@angular/core/testing';
import { TestUtils } from '../../test';
import { PersistenceProvider } from '../persistence/persistence';
import { GiftCardProvider } from './gift-card';
import { AvailableCardMap, ClaimCodeType } from './gift-card.types';

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
      (giftCardProvider: GiftCardProvider, httpMock: HttpTestingController) =>
        fakeAsync(async () => {
          const promise = giftCardProvider.getCardConfig('Amazon.com');
          respondWithAvailableCards(httpMock, giftCardProvider);
          const cardConfig = await promise;
          expect(cardConfig.name).toBe('Amazon.com');
        })
    ));
  });
  describe('getPurchasedCards', () => {
    beforeEach(inject(
      [GiftCardProvider, PersistenceProvider],
      async (giftCardProvider, persistenceProvider) => {
        await saveGiftCards(giftCardProvider, persistenceProvider);
      }
    ));
    it('should return an empty array when the storage key for a brand is unset', inject(
      [GiftCardProvider, HttpTestingController],
      (giftCardProvider: GiftCardProvider, httpMock: HttpTestingController) =>
        fakeAsync(async () => {
          const promise = giftCardProvider.getPurchasedCards('Amazon.co.jp');
          respondWithAvailableCards(httpMock, giftCardProvider);
          const cards = await promise;
          expect(cards).toEqual([]);
        })
    ));
    it('should handle really old gift cards that do not have a currency defined in storage', inject(
      [GiftCardProvider, HttpTestingController],
      (giftCardProvider: GiftCardProvider, httpMock: HttpTestingController) =>
        fakeAsync(async () => {
          const promise = giftCardProvider.getPurchasedCards('Amazon.com');
          respondWithAvailableCards(httpMock, giftCardProvider);
          const cards = await promise;
          expect(cards[0].currency).toBe('USD');
        })
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
      (giftCardProvider: GiftCardProvider, httpMock: HttpTestingController) =>
        fakeAsync(async () => {
          const archivePromise = giftCardProvider.archiveAllCards('Amazon.com');
          respondWithAvailableCards(httpMock, giftCardProvider);
          await archivePromise;
          const cards = await giftCardProvider.getPurchasedCards('Amazon.com');
          expect(cards.every(c => c.archived)).toBe(true);
        })
    ));
  });
});

function respondWithAvailableCards(
  httpMock: HttpTestingController,
  giftCardProvider: GiftCardProvider,
  availableCardMap: AvailableCardMap = ({
    ['Amazon.com']: [
      {
        currency: 'USD',
        cardImage: 'https://amazon-card-image',
        description: 'Buy these up.',
        defaultClaimCodeType: ClaimCodeType.code,
        displayName: 'Amazon',
        emailRequired: true,
        icon: 'https://amazon-icon',
        logo: 'https://amazon-logo',
        logoBackgroundColor: '#000000',
        redeemUrl: 'https://amazon-redeem',
        redeemInstructions: 'Redeem now.',
        terms: 'Very nice terms for you',
        type: 'range',
        website: 'amazon.com'
      }
    ]
  } as any) as AvailableCardMap
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
    displayName: 'Amazon',
    claimCode: 'cLaImCoDe',
    currency: 'USD',
    date: new Date(),
    invoiceId: '1',
    invoiceUrl: '',
    name: 'Amazon.com',
    status: 'SUCCESS',
    uuid: ''
  };
  return persistenceProvider.setGiftCards(
    'Amazon.com',
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
