import { TestBed, inject, async } from '@angular/core/testing';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import {
  AlertController,
  App,
  Config,
  Events,
  LoadingController,
  Platform
} from 'ionic-angular';
import * as _ from 'lodash';
import {
  TranslateModule,
  TranslateService,
  TranslateLoader,
  TranslateFakeLoader
} from '@ngx-translate/core';
import { NgLoggerModule, Level } from '@nsalaun/ng-logger';

import { Logger } from '../../providers/logger/logger';
import { WalletProvider } from '../wallet/wallet';
import { ProfileProvider } from './profile';
import { PersistenceProvider } from '../persistence/persistence';
import { ConfigProvider } from '../config/config';
import { BwcProvider } from '../bwc/bwc';
import { BwcErrorProvider } from '../bwc-error/bwc-error';
import { PlatformProvider } from '../platform/platform';
import { AppProvider } from '../../providers/app/app';
import { LanguageProvider } from '../../providers/language/language';
import { TxFormatProvider } from '../../providers/tx-format/tx-format';
import { PopupProvider } from '../popup/popup';
import { OnGoingProcessProvider } from '../on-going-process/on-going-process';

describe('Profile Provider', () => {
  let profileProvider: ProfileProvider;
  const walletFixture = {
    api1: {
      id: 'eabee25b-d6ab-4b11-8b76-88570d826914',
      cachedBalance: '10.00 BTC',
      cachedBalanceUpdatedOn: null,
      credentials: {
        coin: 'btc',
        network: 'livenet',
        n: 1,
        m: 1
      },
      status: {
        availableBalanceSat: 1000000000 // 10 BTC
      },
      isComplete: () => {
        return true;
      }
    },
    api2: {
      id: 'zxccv25b-d6ab-4b11-8b76-88570d822222',
      cachedBalance: '5.00 BCH',
      cachedBalanceUpdatedOn: null,
      credentials: {
        coin: 'bch',
        network: 'livenet',
        n: 1,
        m: 1
      },
      status: {
        availableBalanceSat: 500000000 // 5 BCH
      },
      isComplete: () => {
        return true;
      }
    },
    api3: {
      id: 'qwert25b-d6ab-4b11-8b76-88570d833333',
      cachedBalance: '1.50 BTC',
      cachedBalanceUpdatedOn: null,
      credentials: {
        coin: 'btc',
        network: 'testnet',
        n: 2,
        m: 2
      },
      status: {
        availableBalanceSat: 150000000 // 1.50 BTC
      },
      isComplete: () => {
        return true;
      }
    }
  };

  class BwcProviderMock {
    constructor() {}
    getErrors() {
      return 'error';
    }
  }

  class PersistenceProviderMock {
    constructor() {}
    getBalanceCache(walletId: any) {
      return Promise.resolve('0.00 BTC');
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
        App,
        Config,
        ProfileProvider,
        AppProvider,
        { provide: BwcProvider, useClass: BwcProviderMock },
        BwcErrorProvider,
        ConfigProvider,
        HttpClient,
        LanguageProvider,
        LoadingController,
        Logger,
        OnGoingProcessProvider,
        { provide: PersistenceProvider, useClass: PersistenceProviderMock },
        Platform,
        PlatformProvider,
        PopupProvider,
        TranslateService,
        TxFormatProvider,
        WalletProvider,
        Events
      ]
    });
    profileProvider = TestBed.get(ProfileProvider);
    profileProvider.wallet = walletFixture;
  });

  describe('getWallets()', () => {
    it('should get successfully all wallets when no opts', () => {
      const wallets = profileProvider.getWallets();
      expect(wallets).toEqual(_.values(profileProvider.wallet));
    });

    it('should get successfully all wallets when opts are provided', () => {
      const opts = {
        coin: 'btc',
        network: 'testnet',
        n: 2,
        m: 2,
        hasFunds: true,
        minAmount: 0,
        onlyComplete: true
      };
      const wallets = profileProvider.getWallets(opts);
      expect(wallets).toEqual([profileProvider.wallet.api3]);
    });

    it('should not return any wallet when there is no wallets validating provided opts', () => {
      const opts = {
        coin: 'bch',
        network: 'livenet',
        minAmount: 1000000000
      };
      const wallets = profileProvider.getWallets(opts);
      expect(wallets).toEqual([]);
    });
  });
});
