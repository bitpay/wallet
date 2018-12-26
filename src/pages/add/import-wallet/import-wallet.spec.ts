import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TestUtils } from '../../../test';
import { ImportWalletPage } from './import-wallet';

describe('ImportWalletPage', () => {
  let fixture: ComponentFixture<ImportWalletPage>;
  let instance;
  let testBed: typeof TestBed;

  beforeEach(async(() => {
    return TestUtils.configurePageTestingModule([ImportWalletPage]).then(
      testEnv => {
        fixture = testEnv.fixture;
        instance = testEnv.instance;
        testBed = testEnv.testBed;
        fixture.detectChanges();
      }
    );
  }));
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
        words: 'mom mom mom mom mom mom mom mom mom mom mom mom'
      };

      instance.importForm.controls['derivationPath'].setValue(
        info.derivationPath
      );
      instance.importForm.controls['words'].setValue(info.words);
      instance.importForm.controls['bwsURL'].setValue(info.bwsURL);
      expect(instance.importFromFile()).toBeUndefined();
    });
    it('should call importBlob function if has backupText', () => {
      testBed.createComponent(ImportWalletPage);
      let info = {
        derivationPath: "m/44'/0'/0'",
        bwsURL: 'https://bws.bitpay.com/bws/api',
        words: 'mom mom mom mom mom mom mom mom mom mom mom mom',
        backupText: 'test'
      };

      instance.importForm.controls['derivationPath'].setValue(
        info.derivationPath
      );
      instance.importForm.controls['words'].setValue(info.words);
      instance.importForm.controls['bwsURL'].setValue(info.bwsURL);
      instance.importForm.controls['backupText'].setValue(info.backupText);
      const spy = spyOn(instance, 'importBlob');
      instance.importFromFile();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Function: importFromMnemonic', () => {
    beforeEach(() => {
      testBed.createComponent(ImportWalletPage);

      let info = {
        derivationPath: "m/44'/0'/0'",
        bwsURL: 'https://bws.bitpay.com/bws/api',
        bitcoin: true,
        bitcoincash: true,
        words: 'mom1 mom2 mom3 mom4 mom5 mom6 mom7 mom8 mom9 mom10 mom11 mom12',
        backupText: 'test'
      };

      instance.importForm.controls['derivationPath'].setValue(
        info.derivationPath
      );
      instance.importForm.controls['words'].setValue(info.words);
      instance.importForm.controls['bitcoin'].setValue(info.bitcoin);
      instance.importForm.controls['bitcoincash'].setValue(info.bitcoincash);
      instance.importForm.controls['bwsURL'].setValue(info.bwsURL);
      instance.importForm.controls['backupText'].setValue(info.backupText);
    });

    it('should return if importForm is not valid', () => {
      instance.importForm.controls['words'].setValue(null);

      const importMnemonicSpy = spyOn(instance, 'importMnemonic');
      instance.importFromMnemonic();
      expect(importMnemonicSpy).not.toHaveBeenCalled();
    });

    it('should set bwsurl if importForm has bwsURL value', () => {
      instance.importFromMnemonic();
      expect(instance.importFromMnemonic()).toBeUndefined();
    });

    it('should return error when use 13 words', () => {
      instance.importForm.controls['words'].setValue(
        'mom1 mom2 mom3 mom4 mom5 mom6 mom7 mom8 mom9 mom10 mom11 mom12 mom13'
      );

      const popupSpy = spyOn(instance.popupProvider, 'ionicAlert');
      instance.importFromMnemonic();
      expect(popupSpy).toHaveBeenCalledWith(
        'Error',
        'Wrong number of recovery words: 13'
      );
    });

    it('should not return error when use 12 words with extra spaces', () => {
      instance.importForm.controls['words'].setValue(
        '  mom1 mom2 mom3 mom4 mom5  mom6 mom7 mom8 mom9 mom10 mom11 mom12   '
      );

      const importMnemonicSpy = spyOn(instance, 'importMnemonic');
      instance.importFromMnemonic();
      expect(importMnemonicSpy).toHaveBeenCalled();
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
