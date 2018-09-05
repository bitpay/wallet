import { TestUtils } from '../../test';
import { AmazonProvider } from '../amazon/amazon';
import { GiftCardProvider } from './gift-card';
import { CardName } from './gift-card.types';

describe('Provider: Wallet Provider', () => {
  let giftCardProvider: GiftCardProvider;

  beforeEach(() => {
    const testBed = TestUtils.configureProviderTestingModule();
    giftCardProvider = testBed.get(GiftCardProvider);
    const amazonProvider = testBed.get(AmazonProvider);
    spyOn(amazonProvider, 'getSupportedCurrency').and.returnValue(
      Promise.resolve('USD')
    );
  });

  describe('getCardConfig', () => {
    it('should work', async () => {
      const cardConfig = await giftCardProvider.getCardConfig(CardName.amazon);
      expect(cardConfig.name).toBe(CardName.amazon);
    });
  });
});
