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

  /*
  xit('should get services info', (done) => {
    inject([HttpTestingController, AppProvider], (httpMock: HttpTestingController, app: AppProvider) => {
      const body = { content: 'blabla' };
      const status = 200;

      app.getServicesInfo().subscribe(response => {
        console.log('response is', response);
        expect(response).not.toBeNull();
        done();
      });

      let jsonPathServices: string = 'assets/externalServices.json';
      const mockReq = httpMock.expectOne(jsonPathServices);

      mockReq.flush(body);

      httpMock.verify();
    })();
  });
   */

  /*
  fit('should do something', (done) => {
    inject([HttpTestingController, AppProvider], (httpMock: HttpTestingController, app: AppProvider) => {
      const body = { content: 'blabla', name: 'testName' };
      const status = 200;

      app.load().then(response => {
        console.log('response is', response);
        expect(response).not.toBeNull();
        done();
      }).catch(err => {
        console.log('err is', err);
        console.log('HELLLO');
        done();
      });

      let jsonPathApp: string = 'assets/appConfig.json';
      const getInfoReq = httpMock.expectOne(jsonPathServices);
      getInfoReq.flush(body, {
        status: status
      });

      let jsonPathServices: string = 'assets/externalServices.json';
      const getServicesReq = httpMock.expectOne(jsonPathServices);
      getServicesReq.flush(body);

      httpMock.verify();
    })();
  });
   */
});
