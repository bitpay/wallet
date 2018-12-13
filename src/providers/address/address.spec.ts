import { TestUtils } from '../../test';
import { AddressProvider } from './address';

describe('AddressProvider', () => {
  let addressProvider: AddressProvider;

  beforeEach(() => {
    const testBed = TestUtils.configureProviderTestingModule();
    addressProvider = testBed.get(AddressProvider);
  });

  describe('getCoin and getNetwork', () => {
    const testVectors: any[] = [
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
      ]
    ];

    testVectors.forEach(v => {
      it('address ' + v[0] + ' should be ' + v[1] + ' / ' + v[2], () => {
        expect(addressProvider.getCoin(v[0])).toEqual(v[1]);
        expect(addressProvider.getNetwork(v[0])).toEqual(v[2]);
      });
    });

    it('getCoin should return null if we send an invalid address', () => {
      const address = 'invalidAddress';
      const result = addressProvider.getCoin(address);
      expect(result).toBeNull();
    });

    it('getNetwork should return undefined if we send an invalid address', () => {
      const address = 'invalidAddress';
      const result = addressProvider.getNetwork(address);
      expect(result).toBeUndefined();
    });
  });

  describe('checkCoinAndNetworkFromAddr', () => {
    it('should return true if use correct coin and network for BTC livenet address', () => {
      let coin = 'btc';
      let network = 'livenet';
      let BTCLivenetAddress = '15qT4RJTjs7GSTReEmgXr4LbMjTVQ51LZA';
      let result = addressProvider.checkCoinAndNetworkFromAddr(
        coin,
        network,
        BTCLivenetAddress
      );
      expect(result).toEqual(true);

      BTCLivenetAddress = 'bitcoin:1CVuVALD6Zo7ms24n3iUXv162kvUzsHr69';
      result = addressProvider.checkCoinAndNetworkFromAddr(
        coin,
        network,
        BTCLivenetAddress
      );
      expect(result).toEqual(true);
    });

    it('should return true if use correct coin and network for BTC testnet address', () => {
      let coin = 'btc';
      let network = 'testnet';
      let BTCTestnetAddress = 'mscoRRUxbicZdUms3EqDr9jwtCmbbPgfcY';
      let result = addressProvider.checkCoinAndNetworkFromAddr(
        coin,
        network,
        BTCTestnetAddress
      );
      expect(result).toEqual(true);

      BTCTestnetAddress = 'bitcoin:n3LHh1WTFSpSVKXNFQo4U5eLAqowCadFHY';
      result = addressProvider.checkCoinAndNetworkFromAddr(
        coin,
        network,
        BTCTestnetAddress
      );
      expect(result).toEqual(true);
    });

    it('should return true if use correct coin and network for BCH livenet address', () => {
      let coin = 'bch';
      let network = 'livenet';
      let BCHLivenetAddress = 'qq9jk8jskjsmgqnzygwjsghp3knautm2dcnc5e4k7n';
      let result = addressProvider.checkCoinAndNetworkFromAddr(
        coin,
        network,
        BCHLivenetAddress
      );
      expect(result).toEqual(true);

      BCHLivenetAddress =
        'BITCOINCASH:qz8ds306px5n65gffn8u69vvnksfw6huwyjczrvkh3';
      result = addressProvider.checkCoinAndNetworkFromAddr(
        coin,
        network,
        BCHLivenetAddress
      );
      expect(result).toEqual(true);
    });

    it('should return true if use correct coin and network for BCH testnet address', () => {
      let coin = 'bch';
      let network = 'testnet';
      let BCHTestnetAddress = 'qqr99gt5qdk4qyaxxvzeapgjuxkg6x9ueue95fakj7';
      let result = addressProvider.checkCoinAndNetworkFromAddr(
        coin,
        network,
        BCHTestnetAddress
      );
      expect(result).toEqual(true);

      // TODO: we have to update BWS with bitcore-lib-cash version 0.18.1 to get correct values for BCHTEST prefix
      /* BCHTestnetAddress = 'BCHTEST:qqycye950l689c98l7z5j43n4484ssnp4y3uu4ramr';
      result = addressProvider.checkCoinAndNetworkFromAddr(
        coin,
        network,
        BCHTestnetAddress
      );
      expect(result).toEqual(true); */
    });

    it('should return false if we send an invalid address, coin or network', () => {
      let coin = 'btc';
      let network = 'livenet';
      let address = 'invalidAddress';
      let result = addressProvider.checkCoinAndNetworkFromAddr(
        coin,
        network,
        address
      );
      expect(result).toBeFalsy();

      coin = 'btc';
      network = 'testnet';
      address = '1CVuVALD6Zo7ms24n3iUXv162kvUzsHr69'; // BTC livenet
      result = addressProvider.checkCoinAndNetworkFromAddr(
        coin,
        network,
        address
      );
      expect(result).toBeFalsy();

      coin = 'bch';
      network = 'livenet';
      address = 'bitcoin:1CVuVALD6Zo7ms24n3iUXv162kvUzsHr69'; // BTC livenet
      result = addressProvider.checkCoinAndNetworkFromAddr(
        coin,
        network,
        address
      );
      expect(result).toBeFalsy();

      coin = 'bch';
      network = 'testnet';
      address = 'bitcoincash:qz8ds306px5n65gffn8u69vvnksfw6huwyjczrvkh3'; // BCH livenet
      result = addressProvider.checkCoinAndNetworkFromAddr(
        coin,
        network,
        address
      );
      expect(result).toBeFalsy();

      coin = 'btc';
      network = 'livenet';
      address = 'BITCOINCASH:qz8ds306px5n65gffn8u69vvnksfw6huwyjczrvkh3'; // BCH livenet
      result = addressProvider.checkCoinAndNetworkFromAddr(
        coin,
        network,
        address
      );
      expect(result).toBeFalsy();
    });
  });

  describe('checkCoinAndNetworkFromPayPro', () => {
    it('should return true if use correct coin and network for paypro details', () => {
      let coin = 'btc';
      let network = 'livenet';
      let payproDetails = {
        coin: 'btc',
        network: 'livenet'
      };
      let result = addressProvider.checkCoinAndNetworkFromPayPro(
        coin,
        network,
        payproDetails
      );
      expect(result).toEqual(true);

      coin = 'bch';
      network = 'livenet';
      payproDetails = {
        coin: 'bch',
        network: 'livenet'
      };
      result = addressProvider.checkCoinAndNetworkFromPayPro(
        coin,
        network,
        payproDetails
      );
      expect(result).toEqual(true);
    });

    it('should return false if use incorrect coin or network for paypro details', () => {
      let coin = 'btc';
      let network = 'testnet';
      let payproDetails = {
        coin: 'btc',
        network: 'livenet'
      };
      let result = addressProvider.checkCoinAndNetworkFromPayPro(
        coin,
        network,
        payproDetails
      );
      expect(result).toEqual(false);

      coin = 'bch';
      network = 'livenet';
      payproDetails = {
        coin: 'btc',
        network: 'livenet'
      };
      result = addressProvider.checkCoinAndNetworkFromPayPro(
        coin,
        network,
        payproDetails
      );
      expect(result).toEqual(false);
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
  });

  describe('isValid', () => {
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
