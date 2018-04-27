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
import {
  AlertController,
  App,
  Config,
  Events,
  LoadingController,
  Platform
} from 'ionic-angular';

import { Logger } from '../../providers/logger/logger';
import { AppProvider } from '../app/app';
import { BwcErrorProvider } from '../bwc-error/bwc-error';
import { BwcProvider } from '../bwc/bwc';
import { ConfigProvider } from '../config/config';
import { FeeProvider } from '../fee/fee';
import { FilterProvider } from '../filter/filter';
import { LanguageProvider } from '../language/language';
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

  class PersistenceProviderMock {
    constructor() { }
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
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateFakeLoader }
        })
      ],
      providers: [
        AppProvider,
        AlertController,
        AndroidFingerprintAuth,
        App,
        BwcErrorProvider,
        BwcProvider,
        Config,
        ConfigProvider,
        DecimalPipe,
        FeeProvider,
        Events,
        FilterProvider,
        LoadingController,
        Logger,
        LanguageProvider,
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
        createAddress({ }, cb) {
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
        createAddress({ }, cb) {
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
        createAddress({ }, cb) {
          return cb(new Error('MAIN_ADDRESS_GAP_REACHED'));
        },
        getMainAddresses({ }, cb) {
          let mainAddress = [];
          mainAddress.push({ address: 'mainAddress' });
          return cb(null, mainAddress);
        }
      };
      let force = true;
      walletProvider.getAddress(wallet, force).then((mainAddress) => {
        expect(mainAddress).toEqual('mainAddress');
      })
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
