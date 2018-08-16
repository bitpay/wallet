import { TestUtils } from '../../test';
import { PersistenceProvider } from '../persistence/persistence';
import { WalletProvider } from './wallet';

describe('Provider: Wallet Provider', () => {
  let walletProvider: WalletProvider;

  class PersistenceProviderMock {
    constructor() {}
    getLastAddress() {
      return Promise.resolve('storedAddress');
    }
    storeLastAddress(_, address) {
      return Promise.resolve(address);
    }
  }

  beforeEach(() => {
    const testBed = TestUtils.configureProviderTestingModule([
      { provide: PersistenceProvider, useClass: PersistenceProviderMock }
    ]);
    walletProvider = testBed.get(WalletProvider);
  });

  describe('Function: Get Address Function', () => {
    it('should get the last address stored', () => {
      let wallet = {
        isComplete() {
          return true;
        },
        needsBackup: false
      };
      let force = false;
      walletProvider.getAddress(wallet, force).then(address => {
        expect(address).toEqual('storedAddress');
      });
    });

    it('should reject to generate new address if wallet is not complete', () => {
      let wallet = {
        isComplete() {
          return false;
        },
        needsBackup: false
      };
      let force = true;
      walletProvider.getAddress(wallet, force).catch(err => {
        expect(err);
      });
    });

    it('should reject to generate new address if wallet is not backed up', () => {
      let wallet = {
        isComplete() {
          return true;
        },
        needsBackup: true
      };
      let force = true;
      walletProvider.getAddress(wallet, force).catch(err => {
        expect(err);
      });
    });

    it('should force to generate new address', () => {
      let wallet = {
        isComplete() {
          return true;
        },
        needsBackup: false,
        createAddress({}, cb) {
          return cb(null, { address: 'newAddress' });
        }
      };
      let force = true;
      walletProvider.getAddress(wallet, force).then(address => {
        expect(address).toEqual('newAddress');
      });
    });

    it('should reject to generate new address if connection error', () => {
      let wallet = {
        isComplete() {
          return true;
        },
        needsBackup: false,
        createAddress({}, cb) {
          return cb(new Error('CONNECTION_ERROR'));
        }
      };
      let force = true;
      walletProvider.getAddress(wallet, force).catch(err => {
        expect(err).toEqual('Could not create address: Network error');
      });
    });
    it('should return main address if gap reached', () => {
      let wallet = {
        isComplete() {
          return true;
        },
        needsBackup: false,
        createAddress({}, cb) {
          return cb(new Error('MAIN_ADDRESS_GAP_REACHED'));
        },
        getMainAddresses({}, cb) {
          let mainAddress = [];
          mainAddress.push({ address: 'mainAddress' });
          return cb(null, mainAddress);
        }
      };
      let force = true;
      walletProvider.getAddress(wallet, force).then(mainAddress => {
        expect(mainAddress).toEqual('mainAddress');
      });
    });
  });

  describe('Function: Get Protocol Handler Function', () => {
    it('should return bitcoincash if coin is bch and network is livenet', () => {
      let coin = 'bch';
      let network = 'livenet';
      let protocol = walletProvider.getProtocolHandler(coin, network);
      expect(protocol).toEqual('bitcoincash');
    });

    it('should return bchtest if coin is bch and network is testnet', () => {
      let coin = 'bch';
      let network = 'testnet';
      let protocol = walletProvider.getProtocolHandler(coin, network);
      expect(protocol).toEqual('bchtest');
    });

    it('should return bitcoin if coin is btc', () => {
      let coin = 'btc';
      let protocol = walletProvider.getProtocolHandler(coin);
      expect(protocol).toEqual('bitcoin');
    });
  });
});
