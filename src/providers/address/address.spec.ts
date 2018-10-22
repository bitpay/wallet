import { TestUtils } from '../../test';
import { AddressProvider } from './address';

describe('AddressProvider', () => {
  let addressProvider: AddressProvider;

  beforeEach(() => {
    const testBed = TestUtils.configureProviderTestingModule();
    addressProvider = testBed.get(AddressProvider);
  });

  describe('getCoin', () => {
    let BTCLivenetAddresses = [
      '15qT4RJTjs7GSTReEmgXr4LbMjTVQ51LZA',
      'bitcoin:1CVuVALD6Zo7ms24n3iUXv162kvUzsHr69'
    ];

    let BTCTestnetAddresses = [
      'mscoRRUxbicZdUms3EqDr9jwtCmbbPgfcY',
      'bitcoin:n3LHh1WTFSpSVKXNFQo4U5eLAqowCadFHY'
    ];

    let BCHLivenetAddresses = [
      'CHUwf57Maceqk5jhMX6NJkuLEbHEfqqgwx', // BCH Livenet Bitpay Style
      'qq9jk8jskjsmgqnzygwjsghp3knautm2dcnc5e4k7n',
      'bitcoincash:qz8ds306px5n65gffn8u69vvnksfw6huwyjczrvkh3',
      'BITCOINCASH:qz8ds306px5n65gffn8u69vvnksfw6huwyjczrvkh3'
    ];

    let BCHTestnetAddresses = [
      // 'mg6PLV5yyUS6Gy55fJ7f994dQ7RpfJNYC9', // TODO: BCH Testnet Bitpay Style
      'qqr99gt5qdk4qyaxxvzeapgjuxkg6x9ueue95fakj7',
      'bitcoincash:qqycye950l689c98l7z5j43n4484ssnp4y3uu4ramr',
      'BCHTEST:qqycye950l689c98l7z5j43n4484ssnp4y3uu4ramr'
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
  });

  describe('validateAddress', () => {
    it('should validate if BTC livenet address is correct and return correct values', () => {
      let BTCLivenetAddress = '15qT4RJTjs7GSTReEmgXr4LbMjTVQ51LZA';
      let result = addressProvider.validateAddress(BTCLivenetAddress);
      expect(result).toEqual({
        address: '15qT4RJTjs7GSTReEmgXr4LbMjTVQ51LZA',
        isValid: true,
        network: 'livenet',
        coin: 'btc',
        translation: {
          origCoin: 'btc',
          origAddress: '15qT4RJTjs7GSTReEmgXr4LbMjTVQ51LZA',
          resultCoin: 'bch',
          resultAddress: 'CMJLdTeXcv5oLbL4vX1TRZxcyrfuLP7NP2'
        }
      });
    });

    it('should validate if BTC testnet address is correct and return correct values', () => {
      let BTCTestnetAddress = 'mscoRRUxbicZdUms3EqDr9jwtCmbbPgfcY';
      let result = addressProvider.validateAddress(BTCTestnetAddress);
      expect(result).toEqual({
        address: 'mscoRRUxbicZdUms3EqDr9jwtCmbbPgfcY',
        isValid: true,
        network: 'testnet',
        coin: 'btc',
        translation: {
          origCoin: 'btc',
          origAddress: 'mscoRRUxbicZdUms3EqDr9jwtCmbbPgfcY',
          resultCoin: 'bch',
          resultAddress: 'mscoRRUxbicZdUms3EqDr9jwtCmbbPgfcY'
        }
      });
    });

    it('should validate if BCH livenet address is correct and return correct values', () => {
      let BCHLivenetAddress = 'qq9jk8jskjsmgqnzygwjsghp3knautm2dcnc5e4k7n';
      let result = addressProvider.validateAddress(BCHLivenetAddress);
      expect(result).toEqual({
        address: 'qq9jk8jskjsmgqnzygwjsghp3knautm2dcnc5e4k7n',
        isValid: true,
        network: 'livenet',
        coin: 'bch',
        translation: {
          origCoin: 'bch',
          origAddress: 'qq9jk8jskjsmgqnzygwjsghp3knautm2dcnc5e4k7n',
          resultCoin: 'btc',
          resultAddress: '122462mHhZgJqwqGfmmSjFHJcU4pjCKuV9'
        }
      });
    });

    it('should validate if BCH testnet address is correct and return correct values', () => {
      let BCHTestnetAddress = 'qqr99gt5qdk4qyaxxvzeapgjuxkg6x9ueue95fakj7';
      let result = addressProvider.validateAddress(BCHTestnetAddress);
      expect(result).toEqual({
        address: 'qqr99gt5qdk4qyaxxvzeapgjuxkg6x9ueue95fakj7',
        isValid: true,
        network: 'testnet',
        coin: 'bch',
        translation: {
          origCoin: 'bch',
          origAddress: 'qqr99gt5qdk4qyaxxvzeapgjuxkg6x9ueue95fakj7',
          resultCoin: 'btc',
          resultAddress: 'mg6PLV5yyUS6Gy55fJ7f994dQ7RpfJNYC9'
        }
      });
    });

    it('should return invalid values if we send an invalid address', () => {
      let address = 'invalidAddress';
      let result = addressProvider.validateAddress(address);
      expect(result).toEqual({
        address: 'invalidAddress',
        isValid: false,
        network: 'livenet',
        coin: null,
        translation: undefined
      });
    });
  });

  describe('getNetwork', () => {
    it('should return correct network for BTC livenet address', () => {
      let BTCLivenetAddress = '15qT4RJTjs7GSTReEmgXr4LbMjTVQ51LZA';
      let result = addressProvider.getNetwork(BTCLivenetAddress);
      expect(result).toEqual('livenet');

      BTCLivenetAddress = 'bitcoin:1CVuVALD6Zo7ms24n3iUXv162kvUzsHr69';
      result = addressProvider.getNetwork(BTCLivenetAddress);
      expect(result).toEqual('livenet');
    });

    it('should return correct network for BTC testnet address', () => {
      let BTCTestnetAddress = 'mscoRRUxbicZdUms3EqDr9jwtCmbbPgfcY';
      let result = addressProvider.getNetwork(BTCTestnetAddress);
      expect(result).toEqual('testnet');

      BTCTestnetAddress = 'bitcoin:n3LHh1WTFSpSVKXNFQo4U5eLAqowCadFHY';
      result = addressProvider.getNetwork(BTCTestnetAddress);
      expect(result).toEqual('testnet');
    });

    it('should return correct network for BCH livenet address', () => {
      let BCHLivenetAddress = 'qq9jk8jskjsmgqnzygwjsghp3knautm2dcnc5e4k7n';
      let result = addressProvider.getNetwork(BCHLivenetAddress);
      expect(result).toEqual('livenet');

      BCHLivenetAddress =
        'BITCOINCASH:qz8ds306px5n65gffn8u69vvnksfw6huwyjczrvkh3';
      result = addressProvider.getNetwork(BCHLivenetAddress);
      expect(result).toEqual('livenet');
    });

    it('should return correct network for BCH testnet address', () => {
      let BCHTestnetAddress = 'qqr99gt5qdk4qyaxxvzeapgjuxkg6x9ueue95fakj7';
      let result = addressProvider.getNetwork(BCHTestnetAddress);
      expect(result).toEqual('testnet');

      BCHTestnetAddress = 'BCHTEST:qqycye950l689c98l7z5j43n4484ssnp4y3uu4ramr';
      result = addressProvider.getNetwork(BCHTestnetAddress);
      expect(result).toEqual('testnet');
    });

    it('should return undefined if we send an invalid address', () => {
      let address = 'invalidAddress';
      let result = addressProvider.getNetwork(address);
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
