import { async, TestBed } from '@angular/core/testing';
import { File } from '@ionic-native/file';
import { Platform } from 'ionic-angular';

import { Logger } from '../../providers/logger/logger';
import { PersistenceProvider } from '../persistence/persistence';
import { PlatformProvider } from '../platform/platform';
import { ConfigProvider } from './config';

import * as _ from 'lodash';

describe('Provider: Config Provider', () => {
  let persistenceProvider: PersistenceProvider;
  let configProvider: ConfigProvider;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ConfigProvider,
        File,
        Logger,
        { provide: PersistenceProvider },
        Platform,
        PlatformProvider,
        PersistenceProvider
      ]
    });
    configProvider = TestBed.get(ConfigProvider);
    persistenceProvider = TestBed.get(PersistenceProvider);
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
          expect(this.configCache).not.toBeNull();
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
      persistenceProvider.getConfig().then(config => {
        expect(this.configCache).not.toBeNull();
      });
    });
    it('should return error if file is corrupted', () => {
      let promise = Promise.reject('Error Loading Config');
      spyOn(persistenceProvider, 'getConfig').and.returnValue(promise);
      configProvider.load().catch(e => {
        expect(this.configCache).toBeUndefined();
      });
    });
  });

  describe('Function: Set Function', () => {
    it('should store a new config with options', () => {
      let newOpts = '{}';
      expect(newOpts).toBe('{}');
      JSON.parse(newOpts);
      configProvider.set(newOpts);
      expect(this.configCache).not.toBeNull();
    });
  });

  describe('Function: Get Default Function', () => {
    it('should get default config', () => {
      let defaults = configProvider.getDefaults();
      expect(defaults).not.toBeNull();
    });
  });
});
