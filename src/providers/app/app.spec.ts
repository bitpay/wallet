import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { getTestBed, TestBed } from '@angular/core/testing';
import { Device } from '@ionic-native/device';
import { File } from '@ionic-native/file';
import { StatusBar } from '@ionic-native/status-bar';
import {
  TranslateFakeLoader,
  TranslateLoader,
  TranslateModule
} from '@ngx-translate/core';
import { Events, Platform } from 'ionic-angular';
import { ConfigProvider } from '../../providers/config/config';
import { CurrencyProvider } from '../../providers/currency/currency';
import { LanguageProvider } from '../../providers/language/language';
import { Logger } from '../../providers/logger/logger';
import { PersistenceProvider } from '../../providers/persistence/persistence';
import { PlatformProvider } from '../platform/platform';
import { ThemeProvider } from '../theme/theme';
import { AppProvider } from './app';

import { LoggerMock } from '../logger/logger.mock';
import * as appTemplate from './../../../app-template/bitpay/appConfig.json';

describe('AppProvider', () => {
  let injector: TestBed;
  let service: AppProvider;
  let httpMock: HttpTestingController;
  let urls = ['assets/appConfig.json', 'assets/externalServices.json'];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateFakeLoader }
        })
      ],
      providers: [
        AppProvider,
        { provide: Logger, useClass: LoggerMock },
        LanguageProvider,
        CurrencyProvider,
        ConfigProvider,
        Events,
        PersistenceProvider,
        PlatformProvider,
        ThemeProvider,
        Platform,
        File,
        StatusBar,
        Device
      ]
    });

    injector = getTestBed();
    service = injector.get(AppProvider);
    httpMock = injector.get(HttpTestingController);
  });

  describe('load', () => {
    it('should load app info and services', () => {
      service.load();
      httpMock.expectOne(urls[1]).flush({});
      httpMock.expectOne(urls[0]).flush(appTemplate);
    });
  });

  it('should catch an error when loading fails', done => {
    service.config.load = (): Promise<any> => {
      let prom = new Promise((_, reject) => {
        reject('test rejection');
      });
      return prom;
    };

    service.load().catch(() => {
      done();
    });
  });
});
