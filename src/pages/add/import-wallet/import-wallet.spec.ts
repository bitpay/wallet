import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NavParams } from 'ionic-angular';
import { AddressBookProvider } from '../../../providers/address-book/address-book';
import { AppIdentityProvider } from '../../../providers/app-identity/app-identity';
import { BitPayCardProvider } from '../../../providers/bitpay-card/bitpay-card';
import { BitPayProvider } from '../../../providers/bitpay/bitpay';
import { BwcErrorProvider } from '../../../providers/bwc-error/bwc-error';
import { BwcProvider } from '../../../providers/bwc/bwc';
import { ConfigProvider } from '../../../providers/config/config';
import { DerivationPathHelperProvider } from '../../../providers/derivation-path-helper/derivation-path-helper';
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';
import { FeeProvider } from '../../../providers/fee/fee';
import { FeedbackProvider } from '../../../providers/feedback/feedback';
import { FilterProvider } from '../../../providers/filter/filter';
import { HomeIntegrationsProvider } from '../../../providers/home-integrations/home-integrations';
import { IncomingDataProvider } from '../../../providers/incoming-data/incoming-data';
import { LanguageProvider } from '../../../providers/language/language';
import { Logger } from '../../../providers/logger/logger';
import { NodeWebkitProvider } from '../../../providers/node-webkit/node-webkit';
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { PayproProvider } from '../../../providers/paypro/paypro';
import { PersistenceProvider } from '../../../providers/persistence/persistence';
import { PopupProvider } from '../../../providers/popup/popup';
import { ProfileProvider } from '../../../providers/profile/profile';
import { PushNotificationsProvider } from '../../../providers/push-notifications/push-notifications';
import { RateProvider } from '../../../providers/rate/rate';
import { ReleaseProvider } from '../../../providers/release/release';
import { ReplaceParametersProvider } from '../../../providers/replace-parameters/replace-parameters';
import { ScanProvider } from '../../../providers/scan/scan';
import { TimeProvider } from '../../../providers/time/time';
import { TouchIdProvider } from '../../../providers/touchid/touchid';
import { TxFormatProvider } from '../../../providers/tx-format/tx-format';
import { WalletProvider } from '../../../providers/wallet/wallet';
import { TestUtils } from '../../../test';
import { ImportWalletPage } from './import-wallet';

describe('ImportWalletPage', () => {
  let fixture: ComponentFixture<ImportWalletPage>;
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
      return TestUtils.configurePageTestingModule([ImportWalletPage], {
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
          WalletProvider,
          DerivationPathHelperProvider,
          ReplaceParametersProvider
        ]
      }).then(testEnv => {
        fixture = testEnv.fixture;
        instance = testEnv.instance;
        testBed = testEnv.testBed;
        fixture.detectChanges();
      });
    })
  );
  afterEach(() => {
    fixture.destroy();
  });

  describe('Lifecycle Hooks', () => {
    describe('ionViewWillEnter', () => {
      it('should call processWalletInfo function if it has code', () => {
        const spy = spyOn(instance, 'processWalletInfo');
        instance.code =
          "1|mom mom mom mom mom mom mom mom mom mom mom mom|livenet|m/44'/0'/0'|false|btc";
        instance.ionViewWillEnter();
        expect(spy).toHaveBeenCalledWith(instance.code);
      });
    });
  });

  describe('Function: selectTab', () => {
    describe('case: words', () => {
      it('should config enviroment to words case', () => {
        const tab = 'words';
        instance.selectTab(tab);
        expect(instance.file).toBe(null);
      });
    });
    describe('case: file', () => {
      it('should config enviroment to file case', () => {
        const tab = 'file';
        instance.selectTab(tab);
      });
    });
    describe('case: default', () => {
      it('should config enviroment to default case', () => {
        const tab = '';
        instance.selectTab(tab);
      });
    });
  });

  describe('Function: normalizeMnemonic', () => {
    describe('Function called without words', () => {
      it('should return words', () => {
        const words = '';
        expect(instance.normalizeMnemonic(words)).toEqual('');
      });
    });
    describe('Function called with words', () => {
      it('should return words list normalized', () => {
        const nonNormalizedWords =
          'mom  mom mom           mom mom mom mom mom mom mom mom mom';
        expect(instance.normalizeMnemonic(nonNormalizedWords)).toEqual(
          'mom mom mom mom mom mom mom mom mom mom mom mom'
        );
      });
    });
  });

  describe('Function: setDerivationPath', () => {
    it('should set path value to importForm', () => {
      const derivationPath = "m/44'/0'/0'";
      instance.testnetEnabled = false;
      instance.setDerivationPath();
      expect(instance.importForm.value.derivationPath).toEqual(derivationPath);
    });
  });

  describe('Function: importFromFile', () => {
    it('should return if importForm is not valid', () => {
      testBed.createComponent(ImportWalletPage);
      instance.importFromFile();
      expect(instance.importFrom).toBeFalsy();
    });
    it('should return if has not backupFile and backupText', () => {
      testBed.createComponent(ImportWalletPage);
      let info = {
        derivationPath: "m/44'/0'/0'",
        bwsURL: '',
        coin: 'btc',
        words: 'mom mom mom mom mom mom mom mom mom mom mom mom'
      };

      instance.importForm.controls['derivationPath'].setValue(
        info.derivationPath
      );
      instance.importForm.controls['words'].setValue(info.words);
      instance.importForm.controls['coin'].setValue(info.coin);
      instance.importForm.controls['bwsURL'].setValue(info.bwsURL);
      expect(instance.importFromFile()).toBeUndefined();
    });
    it('should call importBlob function if has backupText', () => {
      testBed.createComponent(ImportWalletPage);
      let info = {
        derivationPath: "m/44'/0'/0'",
        bwsURL: 'https://bws.bitpay.com/bws/api',
        coin: 'btc',
        words: 'mom mom mom mom mom mom mom mom mom mom mom mom',
        backupText: 'test'
      };

      instance.importForm.controls['derivationPath'].setValue(
        info.derivationPath
      );
      instance.importForm.controls['words'].setValue(info.words);
      instance.importForm.controls['coin'].setValue(info.coin);
      instance.importForm.controls['bwsURL'].setValue(info.bwsURL);
      instance.importForm.controls['backupText'].setValue(info.backupText);
      const spy = spyOn(instance, 'importBlob');
      instance.importFromFile();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Function: importFromMnemonic', () => {
    it('should return if importForm is not valid', () => {
      testBed.createComponent(ImportWalletPage);
      instance.importFromMnemonic();
      expect(instance.importFrom).toBeFalsy();
    });
    it('should set bwsurl if importForm has bwsURL value', () => {
      testBed.createComponent(ImportWalletPage);
      let info = {
        derivationPath: "m/44'/0'/0'",
        bwsURL: 'https://bws.bitpay.com/bws/api',
        coin: 'btc',
        words: 'mom mom mom mom mom mom mom mom mom mom mom mom',
        backupText: 'test'
      };

      instance.importForm.controls['derivationPath'].setValue(
        info.derivationPath
      );
      instance.importForm.controls['words'].setValue(info.words);
      instance.importForm.controls['coin'].setValue(info.coin);
      instance.importForm.controls['bwsURL'].setValue(info.bwsURL);
      instance.importForm.controls['backupText'].setValue(info.backupText);
      instance.importFromMnemonic();
      expect(instance.importFromMnemonic()).toBeUndefined();
    });
    it('should return if importForm has not words', () => {
      testBed.createComponent(ImportWalletPage);
      let info = {
        derivationPath: "m/44'/0'/0'",
        bwsURL: 'https://bws.bitpay.com/bws/api',
        coin: 'btc',
        words: 'mom mom',
        backupText: 'test'
      };

      instance.importForm.controls['derivationPath'].setValue(
        info.derivationPath
      );
      instance.importForm.controls['words'].setValue(info.words);
      instance.importForm.controls['coin'].setValue(info.coin);
      instance.importForm.controls['bwsURL'].setValue(info.bwsURL);
      instance.importForm.controls['backupText'].setValue(info.backupText);
      expect(instance.importFromMnemonic()).toBeUndefined();
    });
  });

  describe('Function: import', () => {
    it('should call importFromFile function if selectedTab is file', () => {
      const tab = 'file';
      const spy = spyOn(instance, 'importFromFile');
      instance.selectedTab = tab;
      instance.import();
      expect(spy).toHaveBeenCalled();
    });
    it('should call importFromMnemonic function if selectedTab is not file', () => {
      const tab = 'words';
      const spy = spyOn(instance, 'importFromMnemonic');
      instance.selectedTab = tab;
      instance.import();
      expect(spy).toHaveBeenCalled();
    });
  });
});
