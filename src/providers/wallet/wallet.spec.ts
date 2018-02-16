import { DecimalPipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { async, TestBed } from '@angular/core/testing';
import { AndroidFingerprintAuth } from '@ionic-native/android-fingerprint-auth';
import { TouchID } from '@ionic-native/touch-id';
import {
  TranslateFakeLoader,
  TranslateLoader,
  TranslateModule,
  TranslateService
} from '@ngx-translate/core';
import { Level, NgLoggerModule } from '@nsalaun/ng-logger';
import {
  AlertController,
  App,
  Config,
  Events,
  LoadingController,
  Platform
} from 'ionic-angular';

import { Logger } from '../../providers/logger/logger';
import { BwcErrorProvider } from '../bwc-error/bwc-error';
import { BwcProvider } from '../bwc/bwc';
import { ConfigProvider } from '../config/config';
import { FeeProvider } from '../fee/fee';
import { FilterProvider } from '../filter/filter';
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
    public getErrors() {
      return 'error';
    }
    public getBitcoreCash() {}
  }

  class PersistenceProviderMock {
    constructor() {}
    public getLastAddress(walletId: any) {
      return Promise.resolve('storedAddress');
    }
    public storeLastAddress(walletId: any, address: any) {
      return Promise.resolve(address);
    }
  }

  class LoggerMock {
    public infoLogs = [];
    public debugLogs = [];
    public info(data) {
      this.infoLogs.push(data);
    }
    public debug(data) {
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
      const wallet = {
        isComplete() {
          return true;
        }
      };
      const force = false;
      walletProvider.getAddress(wallet, force).then(address => {
        expect(address).toEqual('storedAddress');
      });
    });

    it('should reject to generate new address if wallet is not complete', () => {
      const wallet = {
        isComplete() {
          return false;
        }
      };
      const force = true;
      walletProvider.getAddress(wallet, force).catch(err => {
        expect(err).toEqual('WALLET_NOT_COMPLETE');
      });
    });

    it('should force to generate new address', () => {
      const wallet = {
        isComplete() {
          return true;
        },
        createAddress({}, cb) {
          return cb(null, { address: 'newAddress' });
        }
      };
      const force = true;
      walletProvider.getAddress(wallet, force).then(address => {
        expect(address).toEqual('newAddress');
      });
    });
  });

  describe('Function: Get Protocol Handler Function', () => {
    it('should return bitcoincash if coin is bch', () => {
      const coin = 'bch';
      const protocol = walletProvider.getProtocolHandler(coin);
      expect(protocol).toEqual('bitcoincash');
    });

    it('should return bitcoin if coin is btc', () => {
      const coin = 'btc';
      const protocol = walletProvider.getProtocolHandler(coin);
      expect(protocol).toEqual('bitcoin');
    });
  });
});
