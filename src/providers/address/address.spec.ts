import { TestUtils } from '../../test';
import { AddressProvider } from './address';

describe('AddressProvider', () => {
  let addressProvider: AddressProvider;

  beforeEach(() => {
    const testBed = TestUtils.configureProviderTestingModule();
    addressProvider = testBed.get(AddressProvider);
  });

  describe('getCoinAndNetwork', () => {
    const testVectors: any[] = [
      // Bech32
      ['bc1q9225pawdj2dlwsk3dd8phudsap6vjp7fg3nwdl', 'btc', 'livenet'],
      [
        'bitcoin:bc1qua4502zjcsunhm4a25qfm9d30ml5k384vhy62r?amount=0.0001',
        'btc',
        'livenet'
      ],
      // BTCLivenetAddresses
      ['15qT4RJTjs7GSTReEmgXr4LbMjTVQ51LZA', 'btc', 'livenet'],
      ['bitcoin:1CVuVALD6Zo7ms24n3iUXv162kvUzsHr69', 'btc', 'livenet'],
      [
        'bitcoin:1CVuVALD6Zo7ms24n3iUXv162kvUzsHr69?amount=0.00090000',
        'btc',
        'livenet'
      ],
      // BTCTestnetAddresses
      ['mscoRRUxbicZdUms3EqDr9jwtCmbbPgfcY', 'btc', 'testnet'],
      ['bitcoin:n3LHh1WTFSpSVKXNFQo4U5eLAqowCadFHY', 'btc', 'testnet'],
      [
        'bitcoin:n3LHh1WTFSpSVKXNFQo4U5eLAqowCadFHY?amount=0.00090000',
        'btc',
        'testnet'
      ],
      // BCHLivenetAddresses
      ['CHUwf57Maceqk5jhMX6NJkuLEbHEfqqgwx', 'bch', 'livenet'], // BCH Livenet Bitpay Style
      ['qq9jk8jskjsmgqnzygwjsghp3knautm2dcnc5e4k7n', 'bch', 'livenet'],
      ['bitcoincash:CHUwf57Maceqk5jhMX6NJkuLEbHEfqqgwx', 'bch', 'livenet'],
      [
        'bitcoincash:qz8ds306px5n65gffn8u69vvnksfw6huwyjczrvkh3',
        'bch',
        'livenet'
      ],
      [
        'BITCOINCASH:qz8ds306px5n65gffn8u69vvnksfw6huwyjczrvkh3',
        'bch',
        'livenet'
      ],
      [
        'bitcoincash:qz8ds306px5n65gffn8u69vvnksfw6huwyjczrvkh3?amount=0.00090000',
        'bch',
        'livenet'
      ],
      // BCHTestnetAddresses
      // ['mg6PLV5yyUS6Gy55fJ7f994dQ7RpfJNYC9', 'bch', 'testnet'], // TODO: BCH Testnet Bitpay Style
      ['qqr99gt5qdk4qyaxxvzeapgjuxkg6x9ueue95fakj7', 'bch', 'testnet'],
      [
        'bitcoincash:qqycye950l689c98l7z5j43n4484ssnp4y3uu4ramr',
        'bch',
        'testnet'
      ],
      ['BCHTEST:qqycye950l689c98l7z5j43n4484ssnp4y3uu4ramr', 'bch', 'testnet'],
      [
        'BCHTEST:qqycye950l689c98l7z5j43n4484ssnp4y3uu4ramr?amount=0.00090000',
        'bch',
        'testnet'
      ],
      // ETH Address & URI
      ['0x1CD7b5A3294c8714DB5c48e56DD11a6d7EAeaB4C', 'eth', 'livenet'],
      ['etherum:0x1CD7b5A3294c8714DB5c48e56DD11a6d7EAeaB4C', 'eth', 'livenet'],
      /// XRP Address & URI
      ['rEqj9WKSH7wEkPvWf6b4gCi26Y3F7HbKUF', 'xrp', 'livenet'],
      ['ripple:rEqj9WKSH7wEkPvWf6b4gCi26Y3F7HbKUF', 'xrp', 'livenet']
    ];

    const testnetVectors: any[] = [
      // ETH
      ['0x1CD7b5A3294c8714DB5c48e56DD11a6d7EAeaB4C', 'eth', 'testnet'],
      ['etherum:0x1CD7b5A3294c8714DB5c48e56DD11a6d7EAeaB4C', 'eth', 'testnet'],
      // XRP
      ['rEqj9WKSH7wEkPvWf6b4gCi26Y3F7HbKUF', 'xrp', 'testnet'],
      ['ripple:rEqj9WKSH7wEkPvWf6b4gCi26Y3F7HbKUF', 'xrp', 'testnet']
    ];

    testVectors.forEach(v => {
      it('address ' + v[0] + ' should be ' + v[1] + ' / ' + v[2], () => {
        let addrData = addressProvider.getCoinAndNetwork(v[0]);
        expect(addrData.coin).toEqual(v[1]);
        expect(addrData.network).toEqual(v[2]);
      });
    });

    testnetVectors.forEach(v => {
      it('address ' + v[0] + ' should be ' + v[1] + ' / ' + v[2], () => {
        let addrData = addressProvider.getCoinAndNetwork(v[0], 'testnet');
        expect(addrData.coin).toEqual(v[1]);
        expect(addrData.network).toEqual(v[2]);
      });
    });
  });

  describe('extractAddress', () => {
    it('should return the correct extracted address for BTC', () => {
      let address = '1CVuVALD6Zo7ms24n3iUXv162kvUzsHr69'; // BTC livenet
      let result = addressProvider.extractAddress(address);
      expect(result).toEqual('1CVuVALD6Zo7ms24n3iUXv162kvUzsHr69');

      address = 'bitcoin:1CVuVALD6Zo7ms24n3iUXv162kvUzsHr69'; // BTC livenet with prefix
      result = addressProvider.extractAddress(address);
      expect(result).toEqual('1CVuVALD6Zo7ms24n3iUXv162kvUzsHr69');

      address = 'bitcoin:1CVuVALD6Zo7ms24n3iUXv162kvUzsHr69?amount=0.00090000'; // BTC livenet uri
      result = addressProvider.extractAddress(address);
      expect(result).toEqual('1CVuVALD6Zo7ms24n3iUXv162kvUzsHr69');

      address =
        'bitcoin:bc1qua4502zjcsunhm4a25qfm9d30ml5k384vhy62r?amount=0.00010000'; // Native segwit
      result = addressProvider.extractAddress(address);
      expect(result).toEqual('bc1qua4502zjcsunhm4a25qfm9d30ml5k384vhy62r');
    });

    it('should return the correct extracted address for BCH', () => {
      let address = 'qz8ds306px5n65gffn8u69vvnksfw6huwyjczrvkh3'; // BCH livenet
      let result = addressProvider.extractAddress(address);
      expect(result).toEqual('qz8ds306px5n65gffn8u69vvnksfw6huwyjczrvkh3');

      address = 'BITCOINCASH:qz8ds306px5n65gffn8u69vvnksfw6huwyjczrvkh3'; // BCH livenet with prefix
      result = addressProvider.extractAddress(address);
      expect(result).toEqual('qz8ds306px5n65gffn8u69vvnksfw6huwyjczrvkh3');

      address =
        'BITCOINCASH:qz8ds306px5n65gffn8u69vvnksfw6huwyjczrvkh3?amount=0.00090000'; // BCH livenet uri
      result = addressProvider.extractAddress(address);
      expect(result).toEqual('qz8ds306px5n65gffn8u69vvnksfw6huwyjczrvkh3');

      address = 'BCHTEST:qz8ds306px5n65gffn8u69vvnksfw6huwyjczrvkh3'; // BCH testnet with prefix
      result = addressProvider.extractAddress(address);
      expect(result).toEqual('qz8ds306px5n65gffn8u69vvnksfw6huwyjczrvkh3');

      address =
        'BCHTEST:qz8ds306px5n65gffn8u69vvnksfw6huwyjczrvkh3?amount=0.00090000'; // BCH testnet uri
      result = addressProvider.extractAddress(address);
      expect(result).toEqual('qz8ds306px5n65gffn8u69vvnksfw6huwyjczrvkh3');
    });

    it('should return the correct extracted address for ETH', () => {
      let address = '0x32ed5be73f5c395621287f5cbe1da96caf3c5dec'; // ETH livenet
      let result = addressProvider.extractAddress(address);
      expect(result).toEqual('0x32ed5be73f5c395621287f5cbe1da96caf3c5dec');

      address = 'ethereum:0x32ed5be73f5c395621287f5cbe1da96caf3c5dec'; // ETH livenet with prefix
      result = addressProvider.extractAddress(address);
      expect(result).toEqual('0x32ed5be73f5c395621287f5cbe1da96caf3c5dec');

      address =
        'ethereum:0x32ed5be73f5c395621287f5cbe1da96caf3c5dec?value=1234567890'; // ETH livenet uri
      result = addressProvider.extractAddress(address);
      expect(result).toEqual('0x32ed5be73f5c395621287f5cbe1da96caf3c5dec');
    });

    it('should return the correct extracted address for XRP', () => {
      let address = 'rEqj9WKSH7wEkPvWf6b4gCi26Y3F7HbKUF'; // XRP livenet
      let result = addressProvider.extractAddress(address);
      expect(result).toEqual('rEqj9WKSH7wEkPvWf6b4gCi26Y3F7HbKUF');

      address = 'ripple:rEqj9WKSH7wEkPvWf6b4gCi26Y3F7HbKUF'; // XRP livenet with prefix
      result = addressProvider.extractAddress(address);
      expect(result).toEqual('rEqj9WKSH7wEkPvWf6b4gCi26Y3F7HbKUF');

      address = 'ripple:rEqj9WKSH7wEkPvWf6b4gCi26Y3F7HbKUF?amount=12'; // XRP livenet uri
      result = addressProvider.extractAddress(address);
      expect(result).toEqual('rEqj9WKSH7wEkPvWf6b4gCi26Y3F7HbKUF');
    });
  });

  describe('isValid', () => {
    it('should return true for addresses of BTC livenet native segwit', () => {
      let address = 'bc1qua4502zjcsunhm4a25qfm9d30ml5k384vhy62r'; // BTC livenet
      let result = addressProvider.isValid(address);
      expect(result).toEqual(true);

      address = 'bitcoin:bc1qua4502zjcsunhm4a25qfm9d30ml5k384vhy62r'; // BTC livenet with prefix
      result = addressProvider.isValid(address);
      expect(result).toEqual(true);

      address =
        'bitcoin:bc1qua4502zjcsunhm4a25qfm9d30ml5k384vhy62r?amount=0.00090000'; // BTC livenet uri
      result = addressProvider.isValid(address);
      expect(result).toEqual(true);
    });

    it('should return true for addresses of BTC livenet', () => {
      let address = '1CVuVALD6Zo7ms24n3iUXv162kvUzsHr69'; // BTC livenet
      let result = addressProvider.isValid(address);
      expect(result).toEqual(true);

      address = 'bitcoin:1CVuVALD6Zo7ms24n3iUXv162kvUzsHr69'; // BTC livenet with prefix
      result = addressProvider.isValid(address);
      expect(result).toEqual(true);

      address = 'bitcoin:1CVuVALD6Zo7ms24n3iUXv162kvUzsHr69?amount=0.00090000'; // BTC livenet uri
      result = addressProvider.isValid(address);
      expect(result).toEqual(true);
    });

    it('should return true for addresses of ETH livenet', () => {
      let address = '0x32ed5be73f5c395621287f5cbe1da96caf3c5dec'; // ETH livenet
      let result = addressProvider.isValid(address);
      expect(result).toEqual(true);

      address = 'ethereum:0x32ed5be73f5c395621287f5cbe1da96caf3c5dec'; // ETH livenet with prefix
      result = addressProvider.isValid(address);
      expect(result).toEqual(true);

      address =
        'ethereum:0x32ed5be73f5c395621287f5cbe1da96caf3c5dec?value=1234567890'; // ETH livenet uri
      result = addressProvider.isValid(address);
      expect(result).toEqual(true);
    });

    it('should return true for addresses of XRP livenet', () => {
      let address = 'rEqj9WKSH7wEkPvWf6b4gCi26Y3F7HbKUF'; // XRP livenet
      let result = addressProvider.isValid(address);
      expect(result).toEqual(true);

      address = 'ripple:rEqj9WKSH7wEkPvWf6b4gCi26Y3F7HbKUF'; // XRP livenet with prefix
      result = addressProvider.isValid(address);
      expect(result).toEqual(true);

      address = 'ripple:rEqj9WKSH7wEkPvWf6b4gCi26Y3F7HbKUF?amount=12'; // XRP livenet uri
      result = addressProvider.isValid(address);
      expect(result).toEqual(true);
    });

    it('should return true for addresses of BTC testnet', () => {
      let address = '1CVuVALD6Zo7ms24n3iUXv162kvUzsHr69'; // BTC livenet
      let result = addressProvider.isValid(address);
      expect(result).toEqual(true);

      address = 'bitcoin:1CVuVALD6Zo7ms24n3iUXv162kvUzsHr69'; // BTC livenet with prefix
      result = addressProvider.isValid(address);
      expect(result).toEqual(true);

      address = 'bitcoin:1CVuVALD6Zo7ms24n3iUXv162kvUzsHr69?amount=0.00090000'; // BTC livenet uri
      result = addressProvider.isValid(address);
      expect(result).toEqual(true);
    });

    it('should return true for addresses of BCH livenet', () => {
      let address = 'qz8ds306px5n65gffn8u69vvnksfw6huwyjczrvkh3'; // BCH livenet
      let result = addressProvider.isValid(address);
      expect(result).toEqual(true);

      address = 'BITCOINCASH:qz8ds306px5n65gffn8u69vvnksfw6huwyjczrvkh3'; // BCH livenet with prefix
      result = addressProvider.isValid(address);
      expect(result).toEqual(true);

      address =
        'BITCOINCASH:qz8ds306px5n65gffn8u69vvnksfw6huwyjczrvkh3?amount=0.00090000'; // BCH livenet uri
      result = addressProvider.isValid(address);
      expect(result).toEqual(true);
    });

    // TODO: we have to update BWS with bitcore-lib-cash version 0.18.1 to get correct values for BCHTEST prefix
    /* it('should return true for addresses of BCH testnet', () => {
      address = 'BCHTEST:qz8ds306px5n65gffn8u69vvnksfw6huwyjczrvkh3'; // BCH testnet with prefix
      result = addressProvider.isValid(address);
      expect(result).toEqual(true);

      address =
        'BCHTEST:qz8ds306px5n65gffn8u69vvnksfw6huwyjczrvkh3?amount=0.00090000'; // BCH testnet uri
      result = addressProvider.isValid(address);
      expect(result).toEqual(true);
    }); */

    it('should return false for invalid uri', () => {
      let address = 'bitcoin:1CVuVALD6Zo7ms24n3iUXv162kvUzsHr69?amount=invalid';
      let result = addressProvider.isValid(address);
      expect(result).toEqual(false);

      address = 'bitcoincash:1CVuVALD6Zo7ms24n3iUXv162kvUzsHr69?amount=invalid';
      result = addressProvider.isValid(address);
      expect(result).toEqual(false);

      address = 'bchtest:1CVuVALD6Zo7ms24n3iUXv162kvUzsHr69?amount=invalid';
      result = addressProvider.isValid(address);
      expect(result).toEqual(false);

      address =
        'ethereum:0x32ed5be73f5c395621287f5cbe1da96caf3c5?value=invalid';
      result = addressProvider.isValid(address);
      expect(result).toEqual(false);

      address = 'ripple:rEqj9WKSH7wEkPvWf6b4gCi26Y3F7H?value=invalid';
      result = addressProvider.isValid(address);
      expect(result).toEqual(false);
    });

    it('should return false for invalid addresses', () => {
      let address = 'invalidAddress';
      let result = addressProvider.isValid(address);
      expect(result).toEqual(false);

      result = addressProvider.isValid(undefined);
      expect(result).toEqual(false);

      result = addressProvider.isValid(null);
      expect(result).toEqual(false);
    });
  });
});
