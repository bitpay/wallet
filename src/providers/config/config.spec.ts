import { TestBed, inject, async } from '@angular/core/testing';
import { Logger } from '../../providers/logger/logger';
import {
  TranslateModule,
  TranslateService,
  TranslateLoader,
  TranslateFakeLoader
} from '@ngx-translate/core';
import { PersistenceProvider } from '../../providers/persistence/persistence';
import { PlatformProvider } from '../platform/platform';
import { Platform } from 'ionic-angular';
import { File } from '@ionic-native/file';
import { ConfigProvider } from './config';

describe('Config Provider', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateFakeLoader }
        })
      ],
      providers: [
        ConfigProvider,
        PersistenceProvider,
        PlatformProvider,
        Platform,
        File,
        Logger
      ]
    });
  });

  it('should get defaults', inject([ConfigProvider], (configProvider: ConfigProvider) => {
    let defaults = configProvider.getDefaults();
    expect(defaults).not.toBeNull();
  }));

  it('should get cache', inject([ConfigProvider], (configProvider: ConfigProvider) => {
    let cache = configProvider.get();
    expect(cache).not.toBeNull();
    console.log('cache', cache);
  }));

  it('should load', inject([ConfigProvider], (configProvider: ConfigProvider) => {
    configProvider.load();
  }));

  it('should set options with an object', inject([ConfigProvider], (configProvider: ConfigProvider) => {
    let defaults = configProvider.getDefaults();
    //configProvider.set(defaults);
  }));

  it('should set options with a string', inject([ConfigProvider], (configProvider: ConfigProvider) => {
    //configProvider.set('{"option1":"a","option2":"b"}');
  }));
});
