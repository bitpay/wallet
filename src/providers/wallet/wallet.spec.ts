import { TestBed, async } from '@angular/core/testing';
import { HttpModule } from '@angular/http';
import { ConfigProvider } from '../config/config';
import { WalletProvider } from './wallet';
import { Logger, Level as LoggerLevel } from '@nsalaun/ng-logger';
import { BwcProvider } from '../bwc/bwc';
import { TxFormatProvider } from '../tx-format/tx-format';
import { PersistenceProvider } from '../persistence/persistence';
import { BwcErrorProvider } from '../bwc-error/bwc-error';
import { RateProvider } from '../rate/rate';
import { Filter } from '../filter/filter';
import { PopupProvider } from '../popup/popup';
import { OnGoingProcess } from '../on-going-process/on-going-process';
import { TouchIdProvider } from '../touchid/touchid';

describe('Provider: Wallet Provider', () => {
  let walletProvider: WalletProvider;

  class BwcProviderMock {
    constructor() {
    };
    getErrors() {
      return "error";
    }
  }

  class PersistenceProviderMock {
    constructor() {
    };
    getLastAddress(walletId: any) {
      return Promise.resolve('storedAddress');
    }
    storeLastAddress(walletId: any, address: any) {
      return Promise.resolve(address);
    }
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpModule],
      providers: [
        WalletProvider,
        { provide: ConfigProvider },
        { provide: PersistenceProvider, useClass: PersistenceProviderMock },
        { provide: Logger, useValue: new Logger(LoggerLevel.DEBUG) },
        { provide: TxFormatProvider },
        { provide: BwcProvider, useClass: BwcProviderMock },
        { provide: BwcErrorProvider },
        { provide: RateProvider },
        { provide: Filter },
        { provide: PopupProvider },
        { provide: OnGoingProcess },
        { provide: TouchIdProvider },
      ],
    });
    walletProvider = TestBed.get(WalletProvider);
  });

  describe('Function: Get Address Function', () => {

    it('should get the last address stored', () => {
      let wallet = {
        isComplete: function () {
          return true;
        }
      };
      let force = false;
      walletProvider.getAddress(wallet, force).then((address) => {
        expect(address).toEqual('storedAddress');
      });
    })

    it('should reject to generate new address if wallet is not complete', () => {
      let wallet = {
        isComplete: function () {
          return false;
        }
      };
      let force = true;
      walletProvider.getAddress(wallet, force).catch((err) => {
        expect(err).toEqual('WALLET_NOT_COMPLETE');
      });
    })

    it('should force to generate new address', () => {
      let wallet = {
        isComplete: function () {
          return true;
        },
        createAddress: function ({ }, cb) {
          return cb(null, { address: 'newAddress' });
        }
      };
      let force = true;
      walletProvider.getAddress(wallet, force).then((address) => {
        expect(address).toEqual('newAddress');
      });
    })

  });

  describe('Function: Get Protocol Handler Function', () => {

    it('should return bitcoincash if coin is bch', () => {
      let coin = 'bch';
      let protocol = walletProvider.getProtocolHandler(coin);
      expect(protocol).toEqual('bitcoincash');
    })

    it('should return bitcoin if coin is btc', () => {
      let coin = 'btc';
      let protocol = walletProvider.getProtocolHandler(coin);
      expect(protocol).toEqual('bitcoin');
    })

  });
});