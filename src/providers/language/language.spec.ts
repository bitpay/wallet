import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { TestUtils } from '../../test';
import { ConfigProvider } from '../config/config';
import { PersistenceProvider } from '../persistence/persistence';
import { LanguageProvider } from './language';

describe('LanguageProvider', () => {
  let languageProvider: LanguageProvider;
  let configProvider: ConfigProvider;
  let persistenceProvider: PersistenceProvider;
  let translateService: TranslateService;

  beforeEach(async () => {
    const testBed = TestUtils.configureProviderTestingModule();
    languageProvider = testBed.get(LanguageProvider);
    configProvider = testBed.get(ConfigProvider);
    translateService = testBed.get(TranslateService);
    persistenceProvider = testBed.get(PersistenceProvider);
    await persistenceProvider.load();
  });

  describe('load function', () => {
    it('should set the default language if lang exist', () => {
      const newOpts = {
        wallet: {
          settings: {
            defaultLanguage: 'en'
          }
        }
      };
      configProvider.set(newOpts);
      const momentSpy = spyOn(moment, 'locale');

      languageProvider.load();

      expect(momentSpy).toHaveBeenCalledWith('en');
    });
    it('should get language from browser if lang does not exist', () => {
      const newOpts = {
        wallet: {
          settings: {
            defaultLanguage: ''
          }
        }
      };
      configProvider.set(newOpts);
      const momentSpy = spyOn(moment, 'locale');

      languageProvider.load();
      const browserLang = translateService.getBrowserLang();
      expect(momentSpy).toHaveBeenCalledWith(browserLang);
    });
  });

  describe('set function', () => {
    it('should set a specific language', () => {
      const lang = 'pt';
      const momentSpy = spyOn(moment, 'locale');
      const configProviderSetSpy = spyOn(configProvider, 'set');
      const opt = { wallet: { settings: { defaultLanguage: lang } } };

      languageProvider.set(lang);

      expect(momentSpy).toHaveBeenCalledWith(lang);
      expect(configProviderSetSpy).toHaveBeenCalledWith(opt);
    });
  });
});
