import {
  async,
  ComponentFixture,
  fakeAsync,
  TestBed
} from '@angular/core/testing';

import { TestUtils } from '../../test';

import { HomePage } from './home';

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
import { PopupProvider } from '../../providers/popup/popup';
import { PushNotificationsProvider } from '../../providers/push-notifications/push-notifications';
import { RateProvider } from '../../providers/rate/rate';
import { ReleaseProvider } from '../../providers/release/release';
import { ScanProvider } from '../../providers/scan/scan';
import { TouchIdProvider } from '../../providers/touchid/touchid';
import { TxFormatProvider } from '../../providers/tx-format/tx-format';
import { WalletProvider } from '../../providers/wallet/wallet';
import { BwcErrorProvider } from './../../providers/bwc-error/bwc-error';
import { BwcProvider } from './../../providers/bwc/bwc';
import { ConfigProvider } from './../../providers/config/config';
import { Logger } from './../../providers/logger/logger';
import { PersistenceProvider } from './../../providers/persistence/persistence';
import { ProfileProvider } from './../../providers/profile/profile';

let fixture: ComponentFixture<HomePage>;
let instance: any;

describe('HomePage', () => {
  beforeEach(
    async(() =>
      TestUtils.configurePageTestingModule([HomePage], {
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
          TouchIdProvider,
          TxFormatProvider,
          WalletProvider
        ]
      }).then(compiled => {
        fixture = compiled.fixture;
        instance = compiled.instance;
        fixture.detectChanges();
      })
    )
  );
  afterEach(() => {
    fixture.destroy();
  });

  describe('Lifecycle Hooks', () => {
    describe('ionViewWillEnter', () => {
      it('should not break', () => {
        instance.ionViewWillEnter();
      });
    });

    describe('ionViewDidEnter', () => {
      it('should not break', () => {
        instance.ionViewDidEnter();
      });
    });

    describe('ionViewDidLoad', () => {
      it('should not break', () => {
        instance.ionViewDidLoad();
      });
    });

    describe('ionViewWillLeave', () => {
      it('should not break', () => {
        instance.ionViewWillLeave();
      });
    });
  });

  describe('Methods', () => {
    describe('handleDeepLinksNW', () => {
      beforeEach(() => {
        (window as any).require = () => {
          return {
            App: {
              on: (event, cb) => {}
            }
          };
        };
      });
      afterEach(() => {
        delete (window as any).require;
      });
      it('should not break', () => {
        instance.handleDeepLinksNW();
      });
    });
  });
});
