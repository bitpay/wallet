import { TestUtils } from '../../test';
import { AddressProvider } from './address';

describe('AddressProvider', () => {
  let addressProvider: AddressProvider;

  beforeEach(() => {
    const testBed = TestUtils.configureProviderTestingModule();
    addressProvider = testBed.get(AddressProvider);
  });

  let BTCAddresses = [
    'mscoRRUxbicZdUms3EqDr9jwtCmbbPgfcY', // BTC Testnet
    '15qT4RJTjs7GSTReEmgXr4LbMjTVQ51LZA' // BTC Livenet
  ];

  let BCHAddresses = [
    'CHUwf57Maceqk5jhMX6NJkuLEbHEfqqgwx', // BCH Livenet Bitpay Style
    // 'mg6PLV5yyUS6Gy55fJ7f994dQ7RpfJNYC9', // TODO: BCH Testnet Bitpay Style
    'qq9jk8jskjsmgqnzygwjsghp3knautm2dcnc5e4k7n', // BCH Livenet
    'qqr99gt5qdk4qyaxxvzeapgjuxkg6x9ueue95fakj7' // BCH Testnet
  ];

  describe('getCoin', () => {
    it("should get 'btc' string if address is BTC", () => {
      BTCAddresses.forEach(BTCAddress => {
        expect(addressProvider.getCoin(BTCAddress)).toEqual('btc');
      });
    });

    it("should get 'bch' string if address is BCH", () => {
      BCHAddresses.forEach(BCHAddress => {
        expect(addressProvider.getCoin(BCHAddress)).toEqual('bch');
      });
    });
  });

  describe('validateAddress', () => {
    it('should validate if address is correct', () => {
      BTCAddresses.forEach(BTCAddress => {
        expect(addressProvider.validateAddress(BTCAddress).isValid).toEqual(
          true
        );
      });
      BTCAddresses.forEach(BTCAddress => {
        expect(addressProvider.validateAddress(BTCAddress).isValid).toEqual(
          true
        );
      });
    });
  });
});
