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
