import {
  async,
  ComponentFixture,
  fakeAsync,
  TestBed
} from '@angular/core/testing';

import { Platform } from 'ionic-angular';
import { Subject } from 'rxjs';

import { TestUtils } from '../../test';

import { WalletDetailsPage } from './wallet-details';

import { AddressBookProvider } from '../../providers/address-book/address-book';
import { AppIdentityProvider } from '../../providers/app-identity/app-identity';
import { AppProvider } from '../../providers/app/app';
import { BitPayCardProvider } from '../../providers/bitpay-card/bitpay-card';
import { BitPayProvider } from '../../providers/bitpay/bitpay';
import { ExternalLinkProvider } from '../../providers/external-link/external-link';
import { FeeProvider } from '../../providers/fee/fee';
import { FeedbackProvider } from '../../providers/feedback/feedback';
import { FilterProvider } from '../../providers/filter/filter';
import { HomeIntegrationsProvider } from '../../providers/home-integrations/home-integrations';
import { IncomingDataProvider } from '../../providers/incoming-data/incoming-data';
import { LanguageProvider } from '../../providers/language/language';
import { NodeWebkitProvider } from '../../providers/node-webkit/node-webkit';
import { OnGoingProcessProvider } from '../../providers/on-going-process/on-going-process';
import { PayproProvider } from '../../providers/paypro/paypro';
import { PlatformProvider } from '../../providers/platform/platform';
import { PopupProvider } from '../../providers/popup/popup';
import { PushNotificationsProvider } from '../../providers/push-notifications/push-notifications';
import { RateProvider } from '../../providers/rate/rate';
import { ReleaseProvider } from '../../providers/release/release';
import { ScanProvider } from '../../providers/scan/scan';
import { TimeProvider } from '../../providers/time/time';
import { TouchIdProvider } from '../../providers/touchid/touchid';
import { TxFormatProvider } from '../../providers/tx-format/tx-format';
import { WalletProvider } from '../../providers/wallet/wallet';
import { BwcErrorProvider } from './../../providers/bwc-error/bwc-error';
import { BwcProvider } from './../../providers/bwc/bwc';
import { ConfigProvider } from './../../providers/config/config';
import { Logger } from './../../providers/logger/logger';
import { PersistenceProvider } from './../../providers/persistence/persistence';
import { ProfileProvider } from './../../providers/profile/profile';

describe('WalletDetailsPage', () => {
  let fixture: ComponentFixture<WalletDetailsPage>;
  let instance: any;
  let testBed: typeof TestBed;

  beforeEach(
    async(() => {
      const mockWallet = {
        name: 'Test Wallet',
        cachedStatus: null,
        credentials: { m: 1 },
        status: {},
        canSign: () => true,
        isComplete: () => true,
        isPrivKeyEncrypted: () => true
      };
      spyOn(ProfileProvider.prototype, 'getWallet').and.returnValue(mockWallet);
      return TestUtils.configurePageTestingModule([WalletDetailsPage], {
        providers: [
          AddressBookProvider,
          AppIdentityProvider,
          BitPayCardProvider,
          BitPayProvider,
          BwcProvider,
          BwcErrorProvider,
          ConfigProvider,
          ExternalLinkProvider,
          FeedbackProvider,
          FeeProvider,
          FilterProvider,
          HomeIntegrationsProvider,
          IncomingDataProvider,
          LanguageProvider,
          Logger,
          NodeWebkitProvider,
          OnGoingProcessProvider,
          PayproProvider,
          PersistenceProvider,
          PopupProvider,
          ProfileProvider,
          PushNotificationsProvider,
          RateProvider,
          ReleaseProvider,
          ScanProvider,
          TimeProvider,
          TouchIdProvider,
          TxFormatProvider,
          WalletProvider
        ]
      }).then(testEnv => {
        fixture = testEnv.fixture;
        instance = testEnv.instance;
        testBed = testEnv.testBed;
        instance.navParams = {
          data: {
            clearCache: false,
            walletId: 'an-id'
          }
        };
        fixture.detectChanges();
      });
    })
  );
  afterEach(() => {
    fixture.destroy();
  });

  describe('Lifecycle Hooks', () => {
    describe('ionViewWillEnter', () => {
      it('should subscribe to events', () => {
        const spy = spyOn(instance.events, 'subscribe');
        instance.ionViewWillEnter();
        expect(spy).toHaveBeenCalledTimes(2);
      });
    });
  });
  describe('Methods', () => {
    describe('groupHistory', () => {
      it('should group transactions by month', () => {
        const getTime = (date: string) => new Date(date).getTime() / 1000;
        const transactions = [
          { time: getTime('Jan 1, 2018') },
          { time: getTime('Jan 3, 2018') },
          { time: getTime('Feb 10, 2018') }
        ];
        instance.history = transactions;
        const groupedTxs = instance.groupHistory(transactions);
        const expectedGroups = [
          [transactions[0], transactions[1]],
          [transactions[2]]
        ];
        expect(groupedTxs).toEqual(expectedGroups);
      });
    });
  });
});
