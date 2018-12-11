import { TestUtils } from '../../test';
import { AddressProvider } from './address';

describe('AddressProvider', () => {
  let addressProvider: AddressProvider;

  beforeEach(() => {
    const testBed = TestUtils.configureProviderTestingModule();
    addressProvider = testBed.get(AddressProvider);
  });

  describe('getCoin', () => {
    const BTCLivenetAddresses = [
      '15qT4RJTjs7GSTReEmgXr4LbMjTVQ51LZA',
      'bitcoin:1CVuVALD6Zo7ms24n3iUXv162kvUzsHr69',
      'bitcoin:1CVuVALD6Zo7ms24n3iUXv162kvUzsHr69?amount=0.00090000'
    ];

    const BTCTestnetAddresses = [
      'mscoRRUxbicZdUms3EqDr9jwtCmbbPgfcY',
      'bitcoin:n3LHh1WTFSpSVKXNFQo4U5eLAqowCadFHY',
      'bitcoin:n3LHh1WTFSpSVKXNFQo4U5eLAqowCadFHY?amount=0.00090000'
    ];

    const BCHLivenetAddresses = [
      'CHUwf57Maceqk5jhMX6NJkuLEbHEfqqgwx', // BCH Livenet Bitpay Style
      'qq9jk8jskjsmgqnzygwjsghp3knautm2dcnc5e4k7n',
      'bitcoincash:qz8ds306px5n65gffn8u69vvnksfw6huwyjczrvkh3',
      'BITCOINCASH:qz8ds306px5n65gffn8u69vvnksfw6huwyjczrvkh3',
      'bitcoincash:qz8ds306px5n65gffn8u69vvnksfw6huwyjczrvkh3?amount=0.00090000'
    ];

    const BCHTestnetAddresses = [
      // 'mg6PLV5yyUS6Gy55fJ7f994dQ7RpfJNYC9', // TODO: BCH Testnet Bitpay Style
      'qqr99gt5qdk4qyaxxvzeapgjuxkg6x9ueue95fakj7',
      'bitcoincash:qqycye950l689c98l7z5j43n4484ssnp4y3uu4ramr',
      'BCHTEST:qqycye950l689c98l7z5j43n4484ssnp4y3uu4ramr',
      'BCHTEST:qqycye950l689c98l7z5j43n4484ssnp4y3uu4ramr?amount=0.00090000'
    ];

    it("should get 'btc' string if address is BTC Livenet", () => {
      BTCLivenetAddresses.forEach(BTCLivenetAddress => {
        expect(addressProvider.getCoin(BTCLivenetAddress)).toEqual('btc');
      });
    });

    it("should get 'btc' string if address is BTC Testnet", () => {
      BTCTestnetAddresses.forEach(BTCTestnetAddress => {
        expect(addressProvider.getCoin(BTCTestnetAddress)).toEqual('btc');
      });
    });

    it("should get 'bch' string if address is BCH Livenet", () => {
      BCHLivenetAddresses.forEach(BCHLivenetAddress => {
        expect(addressProvider.getCoin(BCHLivenetAddress)).toEqual('bch');
      });
    });

    it("should get 'bch' string if address is BCH Testnet", () => {
      BCHTestnetAddresses.forEach(BCHTestnetAddress => {
        expect(addressProvider.getCoin(BCHTestnetAddress)).toEqual('bch');
      });
    });

    it('should return null if we send an invalid address', () => {
      const address = 'invalidAddress';
      const result = addressProvider.getCoin(address);
      expect(result).toBeNull();
    });
  });

  describe('getNetwork', () => {
    const BTCLivenetAddresses = [
      '15qT4RJTjs7GSTReEmgXr4LbMjTVQ51LZA',
      'bitcoin:1CVuVALD6Zo7ms24n3iUXv162kvUzsHr69',
      'bitcoin:1CVuVALD6Zo7ms24n3iUXv162kvUzsHr69?amount=0.00090000'
    ];

    const BTCTestnetAddresses = [
      'mscoRRUxbicZdUms3EqDr9jwtCmbbPgfcY',
      'bitcoin:n3LHh1WTFSpSVKXNFQo4U5eLAqowCadFHY',
      'bitcoin:n3LHh1WTFSpSVKXNFQo4U5eLAqowCadFHY?amount=0.00090000'
    ];

    const BCHLivenetAddresses = [
      'CHUwf57Maceqk5jhMX6NJkuLEbHEfqqgwx', // BCH Livenet Bitpay Style
      'qq9jk8jskjsmgqnzygwjsghp3knautm2dcnc5e4k7n',
      'bitcoincash:qz8ds306px5n65gffn8u69vvnksfw6huwyjczrvkh3',
      'BITCOINCASH:qz8ds306px5n65gffn8u69vvnksfw6huwyjczrvkh3',
      'bitcoincash:qz8ds306px5n65gffn8u69vvnksfw6huwyjczrvkh3?amount=0.00090000'
    ];

    const BCHTestnetAddresses = [
      // 'mg6PLV5yyUS6Gy55fJ7f994dQ7RpfJNYC9', // TODO: BCH Testnet Bitpay Style
      'qqr99gt5qdk4qyaxxvzeapgjuxkg6x9ueue95fakj7',
      'bitcoincash:qqycye950l689c98l7z5j43n4484ssnp4y3uu4ramr',
      'BCHTEST:qqycye950l689c98l7z5j43n4484ssnp4y3uu4ramr',
      'BCHTEST:qqycye950l689c98l7z5j43n4484ssnp4y3uu4ramr?amount=0.00090000'
    ];

    it("should get 'livenet' string if address is BTC Livenet", () => {
      BTCLivenetAddresses.forEach(BTCLivenetAddress => {
        expect(addressProvider.getNetwork(BTCLivenetAddress)).toEqual(
          'livenet'
        );
      });
    });

    it("should get 'testnet' string if address is BTC Testnet", () => {
      BTCTestnetAddresses.forEach(BTCTestnetAddress => {
        expect(addressProvider.getNetwork(BTCTestnetAddress)).toEqual(
          'testnet'
        );
      });
    });

    it("should get 'livenet' string if address is BCH Livenet", () => {
      BCHLivenetAddresses.forEach(BCHLivenetAddress => {
        expect(addressProvider.getNetwork(BCHLivenetAddress)).toEqual(
          'livenet'
        );
      });
    });

    it("should get 'testnet' string if address is BCH Testnet", () => {
      BCHTestnetAddresses.forEach(BCHTestnetAddress => {
        expect(addressProvider.getNetwork(BCHTestnetAddress)).toEqual(
          'testnet'
        );
      });
    });

    it('should return null if we send an invalid address', () => {
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
