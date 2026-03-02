import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalMock } from 'ionic-mocks';
import { TestUtils } from '../../../test';
import { ImportWalletPage } from './import-wallet';

// providers
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';

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

  describe('Function: setForm', () => {
    it('should set form correctly if there is processed info', () => {
      instance.processedInfo = {
        type: '1',
        data: 'mom mom mom mom mom mom mom mom mom mom mom mom',
        network: 'livenet',
        derivationPath: "m/44'/0'/0'",
        hasPassphrase: false,
        coin: 'btc'
      };
      instance.setForm();
      expect(instance.importForm.value.words).toBe(
        'mom mom mom mom mom mom mom mom mom mom mom mom'
      );
    });
  });

  describe('Function: processWalletInfo', () => {
    it('should return the correct parsed info', () => {
      const code =
        "1|mom mom mom mom mom mom mom mom mom mom mom mom|livenet|m/44'/0'/0'|false|btc";
      const processedInfo = instance.processWalletInfo(code);
      expect(processedInfo).toEqual({
        type: '1',
        data: 'mom mom mom mom mom mom mom mom mom mom mom mom',
        network: 'livenet',
        derivationPath: "m/44'/0'/0'",
        hasPassphrase: false,
        coin: 'btc'
      });
    });
  });

  describe('Function: importFromFile', () => {
    beforeEach(() => {
      const actionSheetProvider: ActionSheetProvider = testBed.get(
        ActionSheetProvider
      );
      const modal = ModalMock.instance();
      spyOn(actionSheetProvider, 'createInfoSheet').and.returnValue(modal);
    });
    it('should return if has not backupFile and backupText', () => {
      testBed.createComponent(ImportWalletPage);
      let info = {
        bwsURL: '',
        words: 'mom mom mom mom mom mom mom mom mom mom mom mom'
      };

      instance.importForm.controls['words'].setValue(info.words);
      instance.importForm.controls['bwsURL'].setValue(info.bwsURL);
      expect(instance.importFromFile()).toBeUndefined();
    });
    it('should call importBlob function if has backupText', () => {
      testBed.createComponent(ImportWalletPage);
      let info = {
        bwsURL: 'https://bws.bitpay.com/bws/api',
        words: 'mom mom mom mom mom mom mom mom mom mom mom mom',
        backupText: 'test'
      };
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
        bwsURL: 'https://bws.bitpay.com/bws/api',
        words: 'mom1 mom2 mom3 mom4 mom5 mom6 mom7 mom8 mom9 mom10 mom11 mom12',
        backupText: 'test'
      };

      instance.importForm.controls['words'].setValue(info.words);
      instance.importForm.controls['bwsURL'].setValue(info.bwsURL);
      instance.importForm.controls['backupText'].setValue(info.backupText);
    });

    it('should return if importForm is not valid', () => {
      const actionSheetProvider: ActionSheetProvider = testBed.get(
        ActionSheetProvider
      );
      const modal = ModalMock.instance();
      spyOn(actionSheetProvider, 'createInfoSheet').and.returnValue(modal);
      instance.importForm.controls['words'].setValue(null);

      const importMnemonicSpy = spyOn(instance, 'importMnemonic');
      instance.importFromMnemonic();
      expect(importMnemonicSpy).not.toHaveBeenCalled();
    });

    it('should return error when use 13 words', () => {
      instance.importForm.controls['words'].setValue(
        'mom1 mom2 mom3 mom4 mom5 mom6 mom7 mom8 mom9 mom10 mom11 mom12 mom13'
      );
      const actionSheetProvider: ActionSheetProvider = testBed.get(
        ActionSheetProvider
      );
      const modal = ModalMock.instance();
      spyOn(actionSheetProvider, 'createInfoSheet').and.returnValue(modal);
      instance.importFromMnemonic();
      expect(actionSheetProvider.createInfoSheet).toHaveBeenCalledWith(
        'recovery-phrase-length',
        {
          wordListLength: 13
        }
      );
      expect(modal.present).toHaveBeenCalled();
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
