import { HttpClientModule } from '@angular/common/http';
import { NgLoggerModule, Level } from '@nsalaun/ng-logger';
import { DecimalPipe } from '@angular/common';
import { TestBed, async } from '@angular/core/testing';
import {
  AlertController,
  Events,
  App,
  Config,
  Platform,
  LoadingController
} from 'ionic-angular';
import {
  TranslateModule,
  TranslateService,
  TranslateLoader,
  TranslateFakeLoader
} from '@ngx-translate/core';
import { TouchID } from '@ionic-native/touch-id';
import { AndroidFingerprintAuth } from '@ionic-native/android-fingerprint-auth';

import { BwcErrorProvider } from '../bwc-error/bwc-error';
import { BwcProvider } from '../bwc/bwc';
import { ConfigProvider } from '../config/config';
import { FeeProvider } from '../fee/fee';
import { FilterProvider } from '../filter/filter';
import { Logger } from '../../providers/logger/logger';
import { OnGoingProcessProvider } from '../on-going-process/on-going-process';
import { PersistenceProvider } from '../persistence/persistence';
import { PlatformProvider } from '../platform/platform';
import { PopupProvider } from '../popup/popup';
import { RateProvider } from '../rate/rate';
import { TouchIdProvider } from '../touchid/touchid';
import { TxFormatProvider } from '../tx-format/tx-format';
import { WalletProvider } from './wallet';

describe('Provider: Wallet Provider', () => {
  let walletProvider: WalletProvider;

  class BwcProviderMock {
    constructor() {}
    getErrors() {
      return 'error';
    }
    getBitcoreCash() {}
  }

  class PersistenceProviderMock {
    constructor() {}
    getLastAddress(walletId: any) {
      return Promise.resolve('storedAddress');
    }
    storeLastAddress(walletId: any, address: any) {
      return Promise.resolve(address);
    }
  }

  class LoggerMock {
    infoLogs = [];
    debugLogs = [];
    info(data) {
      this.infoLogs.push(data);
    }
    debug(data) {
      this.debugLogs.push(data);
    }
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientModule,
        NgLoggerModule.forRoot(Level.LOG),
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateFakeLoader }
        })
      ],
      providers: [
        AlertController,
        AndroidFingerprintAuth,
        App,
        BwcErrorProvider,
        { provide: BwcProvider, useClass: BwcProviderMock },
        Config,
        ConfigProvider,
        DecimalPipe,
        FeeProvider,
        Events,
        FilterProvider,
        LoadingController,
        Logger,
        OnGoingProcessProvider,
        { provide: PersistenceProvider, useClass: PersistenceProviderMock },
        Platform,
        PlatformProvider,
        PopupProvider,
        RateProvider,
        TouchID,
        TouchIdProvider,
        TranslateService,
        TxFormatProvider,
        WalletProvider
      ]
    });
    walletProvider = TestBed.get(WalletProvider);
  });

  describe('Function: Get Address Function', () => {
    it('should get the last address stored', () => {
      let wallet = {
        isComplete: function() {
          return true;
        }
      };
      let force = false;
      walletProvider.getAddress(wallet, force).then(address => {
        expect(address).toEqual('storedAddress');
      });
    });

    it('should reject to generate new address if wallet is not complete', () => {
      let wallet = {
        isComplete: function() {
          return false;
        }
      };
      let force = true;
      walletProvider.getAddress(wallet, force).catch(err => {
        expect(err).toEqual('WALLET_NOT_COMPLETE');
      });
    });

    it('should force to generate new address', () => {
      let wallet = {
        isComplete: function() {
          return true;
        },
        createAddress: function({}, cb) {
          return cb(null, { address: 'newAddress' });
        }
      };
      let force = true;
      walletProvider.getAddress(wallet, force).then(address => {
        expect(address).toEqual('newAddress');
      });
    });
  });

  describe('Function: Get Protocol Handler Function', () => {
    it('should return bitcoincash if coin is bch', () => {
      let coin = 'bch';
      let protocol = walletProvider.getProtocolHandler(coin);
      expect(protocol).toEqual('bitcoincash');
    });

    it('should return bitcoin if coin is btc', () => {
      let coin = 'btc';
      let protocol = walletProvider.getProtocolHandler(coin);
      expect(protocol).toEqual('bitcoin');
    });
  });
});
