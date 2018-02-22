import { TestBed, inject, async } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { XHRBackend, Response, ResponseOptions } from '@angular/http';
import { MockBackend, MockConnection } from '@angular/http/testing';
import { AppProvider } from './app';
import { NgLoggerModule, Level } from '@nsalaun/ng-logger';
import { Logger } from '../../providers/logger/logger';
import {
  TranslateModule,
  TranslateService,
  TranslateLoader,
  TranslateFakeLoader
} from '@ngx-translate/core';
import { LanguageProvider } from '../../providers/language/language';
import { ConfigProvider } from '../../providers/config/config';
import { PersistenceProvider } from '../../providers/persistence/persistence';
import { PlatformProvider } from '../platform/platform';
import { Platform } from 'ionic-angular';
import { File } from '@ionic-native/file';

describe('AppProvider', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        NgLoggerModule.forRoot(Level.LOG),
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateFakeLoader }
        })
      ],
      providers: [
        AppProvider,
        Logger,
        LanguageProvider,
        ConfigProvider,
        PersistenceProvider,
        PlatformProvider,
        Platform,
        File,
        {provide: XHRBackend, useClass: MockBackend}
      ]
    });

  });
});
