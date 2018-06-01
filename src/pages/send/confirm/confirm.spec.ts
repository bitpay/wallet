import { async, ComponentFixture } from '@angular/core/testing';

import { TestUtils } from '../../../test';

import { ConfirmPage } from './confirm';

describe('ConfirmPage', () => {
  let fixture: ComponentFixture<ConfirmPage>;
  let instance: any;

  beforeEach(async(() =>
    TestUtils.configurePageTestingModule([ConfirmPage]).then(testEnv => {
      fixture = testEnv.fixture;
      instance = testEnv.instance;
      instance.navParams = {
        data: {
          toAddress: 'n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF'
        }
      };
      instance.tx = { coin: 'BTC' };
      spyOn(instance.onGoingProcessProvider, 'set');
      fixture.detectChanges();
    })));
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
        instance.modalCtrl.create = () => modal;
        instance.chooseFeeLevel();
        expect(presentSpy).toHaveBeenCalled();
      });
    });
    describe('onFeeModalDismiss', () => {
      it('should set usingCustomFee to true if newFeeLevel is custom', () => {
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
  });
});
