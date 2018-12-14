import {
  async,
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick
} from '@angular/core/testing';
import { Events } from 'ionic-angular';

import { Coin } from '../../providers/wallet/wallet';
import { TestUtils } from '../../test';
import { WalletTabsChild } from '../wallet-tabs/wallet-tabs-child';
import { WalletTabsProvider } from '../wallet-tabs/wallet-tabs.provider';

// pages
import { SendPage } from './send';

describe('SendPage', () => {
  let fixture: ComponentFixture<SendPage>;
  let instance;
  let testBed: typeof TestBed;

  const wallet = {
    coin: 'bch',
    status: {
      totalBalanceStr: '1.000000'
    }
  };

  beforeEach(async(() => {
    spyOn(WalletTabsChild.prototype, 'getParentWallet').and.returnValue(wallet);
    TestUtils.configurePageTestingModule([SendPage]).then(testEnv => {
      fixture = testEnv.fixture;
      instance = testEnv.instance;
      instance.navParams = {
        data: {}
      };
      instance.wallet = wallet;
      testBed = testEnv.testBed;
      fixture.detectChanges();
    });
  }));
  afterEach(() => {
    fixture.destroy();
  });

  describe('Lifecycle Hooks', () => {
    describe('ionViewWillEnter', () => {
      it('should call get functions and subscribe to events', () => {
        const profileProviderSpy = spyOn(
          instance.profileProvider,
          'getWallets'
        );
        const subscribeSpy = spyOn(instance.events, 'subscribe');
        instance.ionViewWillEnter();

        expect(subscribeSpy).toHaveBeenCalledTimes(1);
        expect(profileProviderSpy).toHaveBeenCalledWith({ coin: 'btc' });
        expect(profileProviderSpy).toHaveBeenCalledWith({ coin: 'bch' });
      });
    });
    describe('ionViewWillLeave', () => {
      it('should unsubscribe from events', () => {
        const spy = spyOn(instance.events, 'unsubscribe');
        instance.ionViewWillLeave();
        expect(spy).toHaveBeenCalledWith('update:address');
      });
    });
  });

  describe('processInput', () => {
    describe('for wallets btc livenet', () => {
      beforeEach(() => {
        instance.wallet.coin = 'btc';
        instance.wallet.network = 'livenet';
        instance.navParams.data = {
          amount: 11111111,
          coin: 'btc'
        };

        const checkIfContact = Promise.resolve(false);
        spyOn(instance, 'checkIfContact').and.returnValue(checkIfContact);
      });

      it('should handle addresses btc livenet and call to redir function', async () => {
        const redirSpy = spyOn(instance.incomingDataProvider, 'redir');
        instance.search = '3BzniD7NsTgWL5shRWPt1DRxmPtBuSccnG';
        await instance.processInput();
        expect(instance.invalidAddress).toBeFalsy();
        expect(redirSpy).toHaveBeenCalledWith(
          '3BzniD7NsTgWL5shRWPt1DRxmPtBuSccnG',
          {
            amount: 11111111,
            coin: 'btc'
          }
        );
      });

      it('should handle btc livenet paypro and call to redir function', fakeAsync(() => {
        const redirSpy = spyOn(instance.incomingDataProvider, 'redir');
        const mockPayPro = Promise.resolve({
          coin: 'btc',
          network: 'livenet'
        });
        spyOn(
          instance.incomingDataProvider,
          'getPayProDetails'
        ).and.returnValue(mockPayPro);
        instance.navParams.data.amount = undefined;
        instance.navParams.data.coin = undefined;
        instance.search =
          'bitcoin:?r=https://bitpay.com/i/MB6kXuVY9frBW1DyoZkE5e';
        instance.processInput();
        tick();
        expect(instance.invalidAddress).toBeFalsy();
        expect(redirSpy).toHaveBeenCalledWith(
          'bitcoin:?r=https://bitpay.com/i/MB6kXuVY9frBW1DyoZkE5e',
          {
            amount: undefined,
            coin: undefined
          }
        );
      }));

      it('should handle addresses btc testnet and call to error modal', async () => {
        const errorModalSpy = spyOn(instance, 'showErrorMessage');
        instance.search = 'mpX44VAhEsUkfpBUFDADtEk9gDFV17G1vT';
        await instance.processInput();
        expect(instance.invalidAddress).toBeTruthy();
        expect(errorModalSpy).toHaveBeenCalled();
      });

      it('should handle address bch livenet and call to error modal', async () => {
        const errorModalSpy = spyOn(instance, 'showErrorMessage');
        instance.search = 'qzcy06mxsk7hw0ru4kzwtrkxds6vf8y34vrm5sf9z7';
        await instance.processInput();
        expect(instance.invalidAddress).toBeTruthy();
        expect(errorModalSpy).toHaveBeenCalled();
      });

      it('should handle address bch testnet and call error modal', async () => {
        const errorModalSpy = spyOn(instance, 'showErrorMessage');
        instance.search = 'qqfs4tjymy5cs0j4lz78y2lvensl0l42wu80z5jass';
        await instance.processInput();
        expect(instance.invalidAddress).toBeTruthy();
        expect(errorModalSpy).toHaveBeenCalled();
      });

      it('should handle paypro bch livenet and call error modal', fakeAsync(() => {
        const errorModalSpy = spyOn(instance, 'showErrorMessage');
        const mockPayPro = Promise.resolve({
          coin: 'bch',
          network: 'livenet'
        });
        spyOn(
          instance.incomingDataProvider,
          'getPayProDetails'
        ).and.returnValue(mockPayPro);
        instance.search =
          'bitcoincash:?r=https://bitpay.com/i/3dZDvRXdxpkL4FoWtkB6ZZ';
        instance.processInput();
        tick();
        expect(instance.invalidAddress).toBeTruthy();
        expect(errorModalSpy).toHaveBeenCalled();
      }));

      it('should handle paypro bch testnet and call error modal', fakeAsync(() => {
        const errorModalSpy = spyOn(instance, 'showErrorMessage');
        const mockPayPro = Promise.resolve({
          coin: 'bch',
          network: 'testnet'
        });
        spyOn(
          instance.incomingDataProvider,
          'getPayProDetails'
        ).and.returnValue(mockPayPro);
        instance.search =
          'bitcoincash:?r=https://test.bitpay.com/i/JTfRobeRFmiCjBivDnzV1Q';
        instance.processInput();
        tick();
        expect(instance.invalidAddress).toBeTruthy();
        expect(errorModalSpy).toHaveBeenCalled();
      }));

      it('should handle paypro btc testnet and call error modal', fakeAsync(() => {
        const errorModalSpy = spyOn(instance, 'showErrorMessage');
        const mockPayPro = Promise.resolve({
          coin: 'btc',
          network: 'testnet'
        });
        spyOn(
          instance.incomingDataProvider,
          'getPayProDetails'
        ).and.returnValue(mockPayPro);
        instance.search =
          'bitcoin:?r=https://test.bitpay.com/i/S5jbsUtrHVuvYQN6XHPuvJ';
        instance.processInput();
        tick();
        expect(instance.invalidAddress).toBeTruthy();
        expect(errorModalSpy).toHaveBeenCalled();
      }));
    });

    describe('for wallets btc testnet', () => {
      beforeEach(() => {
        instance.wallet.coin = 'btc';
        instance.wallet.network = 'testnet';
        instance.navParams.data.amount = 11111111;
        instance.navParams.data.coin = 'btc';

        const checkIfContact = Promise.resolve(false);
        spyOn(instance, 'checkIfContact').and.returnValue(checkIfContact);
      });

      it('should handle addresses btc testnet and call to redir function', async () => {
        const redirSpy = spyOn(instance.incomingDataProvider, 'redir');
        instance.search = 'mpX44VAhEsUkfpBUFDADtEk9gDFV17G1vT';
        await instance.processInput();
        expect(instance.invalidAddress).toBeFalsy();
        expect(redirSpy).toHaveBeenCalledWith(
          'mpX44VAhEsUkfpBUFDADtEk9gDFV17G1vT',
          {
            amount: 11111111,
            coin: 'btc'
          }
        );
      });

      it('should handle btc testnet paypro and call to redir function', fakeAsync(() => {
        const redirSpy = spyOn(instance.incomingDataProvider, 'redir');
        const mockPayPro = Promise.resolve({
          coin: 'btc',
          network: 'testnet'
        });
        spyOn(
          instance.incomingDataProvider,
          'getPayProDetails'
        ).and.returnValue(mockPayPro);
        instance.navParams.data.amount = undefined;
        instance.navParams.data.coin = undefined;
        instance.search =
          'bitcoin:?r=https://test.bitpay.com/i/S5jbsUtrHVuvYQN6XHPuvJ';
        instance.processInput();
        tick();
        expect(instance.invalidAddress).toBeFalsy();
        expect(redirSpy).toHaveBeenCalledWith(
          'bitcoin:?r=https://test.bitpay.com/i/S5jbsUtrHVuvYQN6XHPuvJ',
          {
            amount: undefined,
            coin: undefined
          }
        );
      }));

      it('should handle addresses btc livenet and call to error modal', async () => {
        const errorModalSpy = spyOn(instance, 'showErrorMessage');
        instance.search = '3BzniD7NsTgWL5shRWPt1DRxmPtBuSccnG';
        await instance.processInput();
        expect(instance.invalidAddress).toBeTruthy();
        expect(errorModalSpy).toHaveBeenCalled();
      });

      it('should handle address bch livenet and call to error modal', async () => {
        const errorModalSpy = spyOn(instance, 'showErrorMessage');
        instance.search = 'qzcy06mxsk7hw0ru4kzwtrkxds6vf8y34vrm5sf9z7';
        await instance.processInput();
        expect(instance.invalidAddress).toBeTruthy();
        expect(errorModalSpy).toHaveBeenCalled();
      });

      it('should handle address bch testnet and call error modal', async () => {
        const errorModalSpy = spyOn(instance, 'showErrorMessage');
        instance.search = 'qqfs4tjymy5cs0j4lz78y2lvensl0l42wu80z5jass';
        await instance.processInput();
        expect(instance.invalidAddress).toBeTruthy();
        expect(errorModalSpy).toHaveBeenCalled();
      });

      it('should handle paypro bch livenet and call error modal', fakeAsync(() => {
        const errorModalSpy = spyOn(instance, 'showErrorMessage');
        const mockPayPro = Promise.resolve({
          coin: 'bch',
          network: 'livenet'
        });
        spyOn(
          instance.incomingDataProvider,
          'getPayProDetails'
        ).and.returnValue(mockPayPro);
        instance.search =
          'bitcoincash:?r=https://bitpay.com/i/3dZDvRXdxpkL4FoWtkB6ZZ';
        instance.processInput();
        tick();
        expect(instance.invalidAddress).toBeTruthy();
        expect(errorModalSpy).toHaveBeenCalled();
      }));

      it('should handle paypro bch testnet and call error modal', fakeAsync(() => {
        const errorModalSpy = spyOn(instance, 'showErrorMessage');
        const mockPayPro = Promise.resolve({
          coin: 'bch',
          network: 'testnet'
        });
        spyOn(
          instance.incomingDataProvider,
          'getPayProDetails'
        ).and.returnValue(mockPayPro);
        instance.search =
          'bitcoincash:?r=https://test.bitpay.com/i/JTfRobeRFmiCjBivDnzV1Q';
        instance.processInput();
        tick();
        expect(instance.invalidAddress).toBeTruthy();
        expect(errorModalSpy).toHaveBeenCalled();
      }));

      it('should handle paypro btc livenet and call error modal', fakeAsync(() => {
        const errorModalSpy = spyOn(instance, 'showErrorMessage');
        const mockPayPro = Promise.resolve({
          coin: 'btc',
          network: 'livenet'
        });
        spyOn(
          instance.incomingDataProvider,
          'getPayProDetails'
        ).and.returnValue(mockPayPro);
        instance.search =
          'bitcoin:?r=https://bitpay.com/i/MB6kXuVY9frBW1DyoZkE5e';
        instance.processInput();
        tick();
        expect(instance.invalidAddress).toBeTruthy();
        expect(errorModalSpy).toHaveBeenCalled();
      }));
    });

    describe('for wallets bch livenet', () => {
      beforeEach(() => {
        instance.wallet.coin = 'bch';
        instance.wallet.network = 'livenet';
        instance.navParams.data.amount = 11111111;
        instance.navParams.data.coin = 'bch';

        const checkIfContact = Promise.resolve(false);
        spyOn(instance, 'checkIfContact').and.returnValue(checkIfContact);
      });

      it('should handle addresses bch livenet and call to redir function', async () => {
        const redirSpy = spyOn(instance.incomingDataProvider, 'redir');
        instance.search = 'qzcy06mxsk7hw0ru4kzwtrkxds6vf8y34vrm5sf9z7';
        await instance.processInput();
        expect(instance.invalidAddress).toBeFalsy();
        expect(redirSpy).toHaveBeenCalledWith(
          'qzcy06mxsk7hw0ru4kzwtrkxds6vf8y34vrm5sf9z7',
          {
            amount: 11111111,
            coin: 'bch'
          }
        );
      });

      it('should handle bch livenet paypro and call to redir function', fakeAsync(() => {
        const redirSpy = spyOn(instance.incomingDataProvider, 'redir');
        const mockPayPro = Promise.resolve({
          coin: 'bch',
          network: 'livenet'
        });
        spyOn(
          instance.incomingDataProvider,
          'getPayProDetails'
        ).and.returnValue(mockPayPro);
        instance.navParams.data.amount = undefined;
        instance.navParams.data.coin = undefined;
        instance.search =
          'bitcoincash:?r=https://bitpay.com/i/3dZDvRXdxpkL4FoWtkB6ZZ';
        instance.processInput();
        tick();
        expect(instance.invalidAddress).toBeFalsy();
        expect(redirSpy).toHaveBeenCalledWith(
          'bitcoincash:?r=https://bitpay.com/i/3dZDvRXdxpkL4FoWtkB6ZZ',
          {
            amount: undefined,
            coin: undefined
          }
        );
      }));

      it('should handle addresses btc livenet and call to legacy address info modal', async () => {
        const legacyAddrModalSpy = spyOn(instance, 'showLegacyAddrMessage');
        instance.search = '3BzniD7NsTgWL5shRWPt1DRxmPtBuSccnG';
        await instance.processInput();
        expect(instance.invalidAddress).toBeTruthy();
        expect(legacyAddrModalSpy).toHaveBeenCalled();
      });

      it('should handle address bch testnet and call error modal', async () => {
        const errorModalSpy = spyOn(instance, 'showErrorMessage');
        instance.search = 'qqfs4tjymy5cs0j4lz78y2lvensl0l42wu80z5jass';
        await instance.processInput();
        expect(instance.invalidAddress).toBeTruthy();
        expect(errorModalSpy).toHaveBeenCalled();
      });

      it('should handle address btc testnet and call error modal', async () => {
        const errorModalSpy = spyOn(instance, 'showErrorMessage');
        instance.search = 'mpX44VAhEsUkfpBUFDADtEk9gDFV17G1vT';
        await instance.processInput();
        expect(instance.invalidAddress).toBeTruthy();
        expect(errorModalSpy).toHaveBeenCalled();
      });

      it('should handle paypro btc livenet and call error modal', fakeAsync(() => {
        const errorModalSpy = spyOn(instance, 'showErrorMessage');
        const mockPayPro = Promise.resolve({
          coin: 'btc',
          network: 'livenet'
        });
        spyOn(
          instance.incomingDataProvider,
          'getPayProDetails'
        ).and.returnValue(mockPayPro);
        instance.search =
          'bitcoin:?r=https://bitpay.com/i/MB6kXuVY9frBW1DyoZkE5e';
        instance.processInput();
        tick();
        expect(instance.invalidAddress).toBeTruthy();
        expect(errorModalSpy).toHaveBeenCalled();
      }));

      it('should handle paypro bch testnet and call error modal', fakeAsync(() => {
        const errorModalSpy = spyOn(instance, 'showErrorMessage');
        const mockPayPro = Promise.resolve({
          coin: 'bch',
          network: 'testnet'
        });
        spyOn(
          instance.incomingDataProvider,
          'getPayProDetails'
        ).and.returnValue(mockPayPro);
        instance.search =
          'bitcoincash:?r=https://test.bitpay.com/i/JTfRobeRFmiCjBivDnzV1Q';
        instance.processInput();
        tick();
        expect(instance.invalidAddress).toBeTruthy();
        expect(errorModalSpy).toHaveBeenCalled();
      }));

      it('should handle paypro btc testnet and call error modal', fakeAsync(() => {
        const errorModalSpy = spyOn(instance, 'showErrorMessage');
        const mockPayPro = Promise.resolve({
          coin: 'btc',
          network: 'testnet'
        });
        spyOn(
          instance.incomingDataProvider,
          'getPayProDetails'
        ).and.returnValue(mockPayPro);
        instance.search =
          'bitcoin:?r=https://test.bitpay.com/i/S5jbsUtrHVuvYQN6XHPuvJ';
        instance.processInput();
        tick();
        expect(instance.invalidAddress).toBeTruthy();
        expect(errorModalSpy).toHaveBeenCalled();
      }));
    });

    describe('for wallets bch testnet', () => {
      beforeEach(() => {
        instance.wallet.coin = 'bch';
        instance.wallet.network = 'testnet';
        instance.navParams.data.amount = 11111111;
        instance.navParams.data.coin = 'bch';

        const checkIfContact = Promise.resolve(false);
        spyOn(instance, 'checkIfContact').and.returnValue(checkIfContact);
      });

      it('should handle addresses bch testnet and call to redir function', async () => {
        const redirSpy = spyOn(instance.incomingDataProvider, 'redir');
        instance.search = 'qqycye950l689c98l7z5j43n4484ssnp4y3uu4ramr';
        await instance.processInput();
        expect(instance.invalidAddress).toBeFalsy();
        expect(redirSpy).toHaveBeenCalledWith(
          'qqycye950l689c98l7z5j43n4484ssnp4y3uu4ramr',
          {
            amount: 11111111,
            coin: 'bch'
          }
        );
      });

      it('should handle bch testnet paypro and call to redir function', fakeAsync(() => {
        const redirSpy = spyOn(instance.incomingDataProvider, 'redir');
        const mockPayPro = Promise.resolve({
          coin: 'bch',
          network: 'testnet'
        });
        spyOn(
          instance.incomingDataProvider,
          'getPayProDetails'
        ).and.returnValue(mockPayPro);
        instance.navParams.data.amount = undefined;
        instance.navParams.data.coin = undefined;
        instance.search =
          'bitcoincash:?r=https://bitpay.com/i/3dZDvRXdxpkL4FoWtkB6ZZ';
        instance.processInput();
        tick();
        expect(instance.invalidAddress).toBeFalsy();
        expect(redirSpy).toHaveBeenCalledWith(
          'bitcoincash:?r=https://bitpay.com/i/3dZDvRXdxpkL4FoWtkB6ZZ',
          {
            amount: undefined,
            coin: undefined
          }
        );
      }));

      it('should handle addresses bch livenet and call to error modal', async () => {
        const errorModalSpy = spyOn(instance, 'showErrorMessage');
        instance.search =
          'bitcoincash:qz8ds306px5n65gffn8u69vvnksfw6huwyjczrvkh3';
        await instance.processInput();
        expect(instance.invalidAddress).toBeTruthy();
        expect(errorModalSpy).toHaveBeenCalled();
      });

      it('should handle address btc livenet and call to error modal', async () => {
        const errorModalSpy = spyOn(instance, 'showErrorMessage');
        instance.search = '1CVuVALD6Zo7ms24n3iUXv162kvUzsHr69';
        await instance.processInput();
        expect(instance.invalidAddress).toBeTruthy();
        expect(errorModalSpy).toHaveBeenCalled();
      });

      it('should handle address btc testnet and call showLegacyAddrMessage', async () => {
        const showLegacyAddrMessageSpy = spyOn(
          instance,
          'showLegacyAddrMessage'
        );
        instance.search = 'n3LHh1WTFSpSVKXNFQo4U5eLAqowCadFHY';
        await instance.processInput();
        expect(instance.invalidAddress).toBeTruthy();
        expect(showLegacyAddrMessageSpy).toHaveBeenCalled();
      });

      it('should handle paypro BTC livenet and call error modal', fakeAsync(() => {
        const errorModalSpy = spyOn(instance, 'showErrorMessage');
        const mockPayPro = Promise.resolve({
          coin: 'btc',
          network: 'livenet'
        });
        spyOn(
          instance.incomingDataProvider,
          'getPayProDetails'
        ).and.returnValue(mockPayPro);
        instance.search =
          'bitcoin:?r=https://bitpay.com/i/MB6kXuVY9frBW1DyoZkE5e';
        instance.processInput();
        tick();
        expect(instance.invalidAddress).toBeTruthy();
        expect(errorModalSpy).toHaveBeenCalled();
      }));

      it('should handle paypro BTC testnet and call error modal', fakeAsync(() => {
        const errorModalSpy = spyOn(instance, 'showErrorMessage');
        const mockPayPro = Promise.resolve({
          coin: 'btc',
          network: 'testnet'
        });
        spyOn(
          instance.incomingDataProvider,
          'getPayProDetails'
        ).and.returnValue(mockPayPro);
        instance.search =
          'bitcoin:?r=https://bitpay.com/i/MB6kXuVY9frBW1DyoZkE5e';
        instance.processInput();
        tick();
        expect(instance.invalidAddress).toBeTruthy();
        expect(errorModalSpy).toHaveBeenCalled();
      }));

      it('should handle paypro bch livenet and call error modal', fakeAsync(() => {
        const errorModalSpy = spyOn(instance, 'showErrorMessage');
        const mockPayPro = Promise.resolve({
          coin: 'bch',
          network: 'livenet'
        });
        spyOn(
          instance.incomingDataProvider,
          'getPayProDetails'
        ).and.returnValue(mockPayPro);
        instance.search =
          'bitcoincash:?r=https://bitpay.com/i/3dZDvRXdxpkL4FoWtkB6ZZ';
        instance.processInput();
        tick();
        expect(instance.invalidAddress).toBeTruthy();
        expect(errorModalSpy).toHaveBeenCalled();
      }));
    });

    it('should set input as valid if hasContacts', async () => {
      const checkIfContact = Promise.resolve(true);
      spyOn(instance, 'checkIfContact').and.returnValue(checkIfContact);
      instance.search = 'Contact';
      await instance.processInput();
      expect(instance.invalidAddress).toBeFalsy();
    });
  });

  describe('openScanner', () => {
    it('should pass the pre-selected amount, coin, and sendMax values to the scanner', () => {
      const walletTabsProvider: WalletTabsProvider = testBed.get(
        WalletTabsProvider
      );
      const events: Events = testBed.get(Events);
      instance.navParams = {
        data: {
          amount: '1.00000',
          coin: Coin.BCH
        }
      };
      const amount = '1.00000';
      const coin = Coin.BCH;
      spyOn(instance.navParams, 'data').and.returnValues(amount, coin);
      const sendParamsSpy = spyOn(walletTabsProvider, 'setSendParams');
      const publishSpy = spyOn(events, 'publish');
      instance.openScanner();
      expect(sendParamsSpy).toHaveBeenCalledWith({
        amount,
        coin
      });
      expect(publishSpy).toHaveBeenCalledWith('ScanFromWallet');
    });
  });
});
