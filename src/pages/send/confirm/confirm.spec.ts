import {
  async,
  ComponentFixture,
  fakeAsync,
  TestBed
} from '@angular/core/testing';

import { Platform } from 'ionic-angular';
import { Subject } from 'rxjs';

import { TestUtils } from '../../../test';

import { ConfirmPage } from './confirm';

import { AddressBookProvider } from '../../../providers/address-book/address-book';
import { AppIdentityProvider } from '../../../providers/app-identity/app-identity';
import { AppProvider } from '../../../providers/app/app';
import { BitPayCardProvider } from '../../../providers/bitpay-card/bitpay-card';
import { BitPayProvider } from '../../../providers/bitpay/bitpay';
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';
import { FeeProvider } from '../../../providers/fee/fee';
import { FeedbackProvider } from '../../../providers/feedback/feedback';
import { FilterProvider } from '../../../providers/filter/filter';
import { HomeIntegrationsProvider } from '../../../providers/home-integrations/home-integrations';
import { IncomingDataProvider } from '../../../providers/incoming-data/incoming-data';
import { LanguageProvider } from '../../../providers/language/language';
import { NodeWebkitProvider } from '../../../providers/node-webkit/node-webkit';
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { PayproProvider } from '../../../providers/paypro/paypro';
import { PlatformProvider } from '../../../providers/platform/platform';
import { PopupProvider } from '../../../providers/popup/popup';
import { PushNotificationsProvider } from '../../../providers/push-notifications/push-notifications';
import { RateProvider } from '../../../providers/rate/rate';
import { ReleaseProvider } from '../../../providers/release/release';
import { ScanProvider } from '../../../providers/scan/scan';
import { TouchIdProvider } from '../../../providers/touchid/touchid';
import { TxConfirmNotificationProvider } from '../../../providers/tx-confirm-notification/tx-confirm-notification';
import { TxFormatProvider } from '../../../providers/tx-format/tx-format';
import { WalletProvider } from '../../../providers/wallet/wallet';
import { BwcErrorProvider } from './../../../providers/bwc-error/bwc-error';
import { BwcProvider } from './../../../providers/bwc/bwc';
import { ConfigProvider } from './../../../providers/config/config';
import { Logger } from './../../../providers/logger/logger';
import { PersistenceProvider } from './../../../providers/persistence/persistence';
import { ProfileProvider } from './../../../providers/profile/profile';

describe('ConfirmPage', () => {
  let fixture: ComponentFixture<ConfirmPage>;
  let instance: any;
  let testBed: typeof TestBed;

  beforeEach(
    async(() =>
      TestUtils.configurePageTestingModule([ConfirmPage], {
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
          TxConfirmNotificationProvider,
          TxFormatProvider,
          WalletProvider
        ]
      }).then(testEnv => {
        fixture = testEnv.fixture;
        instance = testEnv.instance;
        testBed = testEnv.testBed;
        instance.navParams.data.toAddress =
          'n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF';
        instance.tx = { coin: 'BTC' };
        spyOn(instance.onGoingProcessProvider, 'set').and.callFake(() => {});
        fixture.detectChanges();
      })
    )
  );
  afterEach(() => {
    fixture.destroy();
  });

  describe('Lifecycle Hooks', () => {
    describe('ionViewWillEnter', () => {
      it('should set swipeBackEnabled to false', () => {
        instance.ionViewWillEnter();
        expect(instance.navCtrl.swipeBackEnabled).toBe(false);
      });
      it('should display an error message if attempting to send to an old bch address', () => {
        instance.navParams.data.toAddress =
          'CUksFGi4uVxpmV8S3JjYMSKJugT8JBvQdu1';
        const popupSpy = spyOn(
          instance.popupProvider,
          'ionicConfirm'
        ).and.returnValue(Promise.resolve());
        instance.ionViewWillEnter();
        expect(popupSpy).toHaveBeenCalled();
      });
      it('should show instantiate the wallet selector with relevant wallets', () => {
        const setWalletSelectorSpy = spyOn(
          instance,
          'setWalletSelector'
        ).and.returnValue(Promise.resolve());
        instance.wallets = [{}, {}];
        const showWalletsSpy = spyOn(instance, 'showWallets');
        instance.ionViewWillEnter();
        expect(setWalletSelectorSpy).toHaveBeenCalled();
      });
    });
    describe('ionViewWillLeave', () => {
      it('should reset swipeBackEnabled to true', () => {
        instance.ionViewWillLeave();
        expect(instance.navCtrl.swipeBackEnabled).toBe(true);
      });
    });
    describe('ionViewDidLoad', () => {
      it('should not break', () => {
        instance.ionViewDidLoad();
      });
    });
  });
  describe('Methods', () => {
    describe('setNoWallet', () => {
      it('should set wallet to null and set the appropriate message', () => {
        const msg = 'No wallets available';
        const error = 'Bad error';
        instance.setNoWallet(msg, error);
        expect(instance.wallet).toBe(null);
        expect(instance.noWalletMessage).toBe(msg);
        expect(instance.criticalError).toBe(error);
      });
    });
    describe('chooseFeeLevel', () => {
      it('should display a fee modal', () => {
        const modal = {
          present: () => {},
          onDidDismiss: () => {}
        };
        const presentSpy = spyOn(modal, 'present');
        spyOn(instance.modalCtrl, 'create').and.returnValue(modal);
        instance.chooseFeeLevel();
        expect(presentSpy).toHaveBeenCalled();
      });
    });
    describe('onFeeModalDismiss', () => {
      it('should set usingCustomeFee to true if newFeeLevel is custom', () => {
        instance.onFeeModalDismiss({ newFeeLevel: 'custom' });
        expect(instance.usingCustomFee).toBe(true);
      });
    });
    describe('setWallet', () => {
      it('should not break', () => {
        instance.tx = { paypro: { expires: 1000 } };
        const wallet = {
          coin: 'BTC',
          credentials: {
            m: 1
          }
        };
        instance.setWallet(wallet);
      });
    });
    describe('showWallets', () => {
      it('should subscribe to the wallet selected event', () => {
        const subscribeSpy = spyOn(instance.events, 'subscribe');
        instance.showWallets();
        expect(subscribeSpy).toHaveBeenCalled();
      });
    });
    describe('onSelectWalletEvent', () => {
      it('should unsubscribe from the wallet selected event', () => {
        const unsubscribeSpy = spyOn(instance.events, 'unsubscribe');
        instance.onSelectWalletEvent({});
        expect(unsubscribeSpy).toHaveBeenCalled();
      });
    });
    describe('confirmTx', () => {
      it('should display a confirm popup', () => {
        const tx = {};
        const txp = { coin: 'BTC' };
        const wallet = {};
        spyOn(instance.txFormatProvider, 'formatToUSD').and.returnValue(
          Promise.resolve('100.50')
        );
        instance.confirmTx(tx, txp, wallet);
      });
    });
    describe('approve', () => {
      const tx = {};
      const txp = { coin: 'BTC' };
      const wallet = {};
      it('should clear the ongoing process loader if user declines', async () => {
        spyOn(instance, 'getTxp').and.returnValue(Promise.resolve(txp));
        spyOn(instance, 'confirmTx').and.returnValue(Promise.resolve(true));
        const clearSpy = spyOn(instance.onGoingProcessProvider, 'clear');
        await instance.approve(tx, wallet);
        expect(clearSpy).toHaveBeenCalled();
      });
      it('should publish and sign upon approval', async () => {
        spyOn(instance, 'getTxp').and.returnValue(Promise.resolve(txp));
        spyOn(instance, 'confirmTx').and.returnValue(Promise.resolve(false));
        const publishSpy = spyOn(instance, 'publishAndSign');
        await instance.approve(tx, wallet);
        expect(publishSpy).toHaveBeenCalled();
      });
      it('should display a popup if the payment has expired', () => {
        instance.paymentExpired = true;
        const popupSpy = spyOn(instance.popupProvider, 'ionicAlert');
        instance.approve(tx, wallet);
        expect(popupSpy).toHaveBeenCalled();
      });
      it('should handle errors', async () => {
        spyOn(instance, 'getTxp').and.returnValue(Promise.reject('bad error'));
        const clearSpy = spyOn(instance.onGoingProcessProvider, 'clear');
        await instance.approve(tx, wallet);
        expect(clearSpy).toHaveBeenCalled();
      });
    });
    describe('onlyPublish', () => {
      const txp = { coin: 'BTC' };
      const wallet = {};
      it('should open the finish modal on success', async () => {
        spyOn(instance.walletProvider, 'onlyPublish').and.returnValue(
          Promise.resolve()
        );
        const modalSpy = spyOn(instance, 'openFinishModal');
        await instance.onlyPublish();
        expect(modalSpy).toHaveBeenCalled();
      });
      it('should set send error on failure', async () => {
        spyOn(instance.walletProvider, 'onlyPublish').and.returnValue(
          Promise.reject('error')
        );
        const setErrorSpy = spyOn(instance, 'setSendError');
        await instance.onlyPublish();
        expect(setErrorSpy).toHaveBeenCalled();
      });
    });
    describe('publishAndSign', () => {
      it('should work', () => {});
    });
  });
});
