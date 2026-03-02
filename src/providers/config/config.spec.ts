import { TestUtils } from '../../test';
import { PersistenceProvider } from '../persistence/persistence';
import { ConfigProvider } from './config';

describe('Provider: Config Provider', () => {
  let persistenceProvider: PersistenceProvider;
  let configProvider: ConfigProvider;

  beforeEach(() => {
    const testBed = TestUtils.configureProviderTestingModule();
    configProvider = testBed.get(ConfigProvider);
    persistenceProvider = testBed.get(PersistenceProvider);
    persistenceProvider.load();
  });

  describe('Function: Load Function', () => {
    it('resolves', () => {
      return configProvider.load().then(() => {
        expect().nothing();
      });
    });
    it('should store a config', () => {
      let newOpts = JSON.parse('{}');
      persistenceProvider.storeConfig(newOpts).then(() => {
        configProvider.load().then(() => {
          expect(configProvider.configCache).not.toBeNull();
        });
      });
    });
    it('should set default config if storage is empty', async () => {
      const defaults = configProvider.getDefaults();
      await persistenceProvider.clearConfig();
      await configProvider.load();
      const config = await persistenceProvider.getConfig();
      expect(config).toBeNull();
      expect(defaults).not.toBeNull();
    });
    it('should set config from storage', () => {
      persistenceProvider.getConfig().then(() => {
        expect(configProvider.configCache).not.toBeNull();
      });
    });
    it('should return error if file is corrupted', () => {
      let promise = Promise.reject('Error Loading Config');
      spyOn(persistenceProvider, 'getConfig').and.returnValue(promise);
      configProvider.load().catch(() => {
        expect(configProvider.configCache).toBeUndefined();
      });
    });
  });

  describe('Function: Set Function', () => {
    it('should store a new config with options', () => {
      let newOpts = '{}';
      expect(newOpts).toBe('{}');
      JSON.parse(newOpts);
      configProvider.set(newOpts);
      expect(configProvider.configCache).not.toBeNull();
    });
  });

  describe('Function: Get Default Function', () => {
    it('should get default config', () => {
      let defaults = configProvider.getDefaults();
      expect(defaults).not.toBeNull();
    });
  });
});
