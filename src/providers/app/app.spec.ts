import { TestBed, getTestBed, inject, async } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { XHRBackend, Response, ResponseOptions } from '@angular/http';
import { MockBackend, MockConnection } from '@angular/http/testing';
import { AppProvider } from './app';
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
  let injector: TestBed;
  let service: AppProvider;
  let httpMock: HttpTestingController;
  let urls = [
    'assets/appConfig.json',
    'assets/externalServices.json'
  ];

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

    injector = getTestBed();
    service = injector.get(AppProvider);
    httpMock = injector.get(HttpTestingController);
  });

  it('should load', (done) => {
    service.load().then(() => {
      done();
    });

    setTimeout(() => {
      httpMock.expectOne(urls[1]).flush('{}');
      httpMock.expectOne(urls[0]).flush('{"packageName":"copay","packageDescription":"Copay Bitcoin Wallet","packageNameId":"com.bitpay.copay","themeColor":"#192c3a","userVisibleName":"Copay","purposeLine":"Copay Bitcoin Wallet","bundleName":"copay","appUri":"copay","name":"copay","nameNoSpace":"copay","nameCase":"Copay","nameCaseNoSpace":"Copay","gitHubRepoName":"copay","gitHubRepoUrl":"git://github.com/bitpay/copay.git","gitHubRepoBugs":"https://github.com/bitpay/copay/issues","disclaimerUrl":"https://copay.io/disclaimer","url":"https://copay.io","appDescription":"Copay Bitcoin Wallet","winAppName":"CopayWallet","WindowsStoreIdentityName":"18C7659D.Copay-SecureBitcoinWallet","WindowsStoreDisplayName":"Copay - Secure Bitcoin Wallet","windowsAppId":"804636ee-b017-4cad-8719-e58ac97ffa5c","pushSenderId":"1036948132229","description":"A Secure Bitcoin Wallet","version":"4.0.5","androidVersion":"40000005","_extraCSS":null,"_enabledExtensions":{"coinbase":true,"glidera":true,"debitcard":false,"amazon":true,"mercadolibre":true,"shapeshift":true},"commitHash":"36d3601"}');
    }, 0);
  });

  it('should catch an error when loading fails', (done) => {
    service.config.load = (): Promise<any> => {
      let prom = new Promise((resolve, reject) => {
        reject('test rejection');
      });
      return prom;
    };

    service.load().catch(() => {
      done();
    });
  });
});
