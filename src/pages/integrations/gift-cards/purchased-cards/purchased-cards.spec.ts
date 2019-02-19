import { async, ComponentFixture } from '@angular/core/testing';
import { TestUtils } from '../../../../test';

import { GiftCard } from '../../../../providers/gift-card/gift-card.types';
import { PurchasedCardsPage } from './purchased-cards';

describe('PurchasedCardsPage', () => {
  let fixture: ComponentFixture<PurchasedCardsPage>;
  let instance: PurchasedCardsPage;

  beforeEach(async(() => {
    TestUtils.configurePageTestingModule([PurchasedCardsPage]).then(testEnv => {
      fixture = testEnv.fixture;
      instance = testEnv.instance;
      fixture.detectChanges();
    });
  }));
  afterEach(() => {
    fixture.destroy();
  });

  describe('setGiftCards', () => {
    it('should properly filter current and archived gift cards', () => {
      const currentCard: GiftCard = {
        archived: false,
        accessKey: 'aAcCess',
        amount: 1,
        displayName: 'Amazon',
        claimCode: 'cLaImCoDe',
        currency: 'USD',
        date: Date.now() / 1000,
        invoiceId: '1',
        invoiceUrl: 'https://bitpay.com/i/iNvOiceId',
        name: 'Amazon.com',
        status: 'SUCCESS',
        uuid: 'uuid'
      };
      const archivedCard = { ...currentCard, archived: true, invoiceId: '2' };
      const allCards = [currentCard, archivedCard];
      instance.setGiftCards(allCards);
      expect(instance.currentGiftCards).toEqual([currentCard]);
      expect(instance.archivedGiftCards).toEqual([archivedCard]);
    });
  });
});
