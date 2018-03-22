import { PlatformProvider } from './platform';

import { TestBed, getTestBed, inject, async } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Logger } from '../../providers/logger/logger';
import {
  TranslateModule,
  TranslateService,
  TranslateLoader,
  TranslateFakeLoader
} from '@ngx-translate/core';
import { Platform } from 'ionic-angular';

describe('PlatformProvider', () => {
  let injector: TestBed;
  let service: PlatformProvider;
  let httpMock: HttpTestingController;
  let userAgent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateFakeLoader }
        })
      ],
      providers: [
        PlatformProvider,
        Logger,
        Platform
      ]
    });
    injector = getTestBed();
    service = injector.get(PlatformProvider);
    httpMock = injector.get(HttpTestingController);
  });

  it('should get browser name', () => {
    let name = service.getBrowserName();
    expect(name).toBe('chrome');
  });

  it('should return "unknown" if browser is unknown', () => {
    // change userAgent
    userAgent = window.navigator.userAgent;
    console.log('before changing userAgent', window.navigator.userAgent);
    Object.defineProperties(window.navigator, {
      userAgent: {
        value: 'someUnknownCoolBrowser v1.0',
        writable: true
      }
    });
    console.log('after changing userAgent', window.navigator.userAgent);

    let name = service.getBrowserName();
    expect(name).toBe('unknown');

    // restore userAgent
    console.log('before restoring userAgent', window.navigator.userAgent);
    Object.defineProperties(window.navigator, {
      userAgent: {
        value: userAgent,
        writable: false
      }
    });
    console.log('after restoring userAgent', window.navigator.userAgent);
  });
});

describe('PlatformProvider without navigator', () => {
  let injector: TestBed;
  let service: PlatformProvider;
  let httpMock: HttpTestingController;
  let navi;

  beforeEach(() => {
    navi = window.navigator;
    console.log('before changing navigator', window.navigator);
    // change navigator
    Object.defineProperties(window, {
      navigator: {
        value: null,
        writable: true
      }
    });
    console.log('after changing navigator', window.navigator);
  });

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
        PlatformProvider,
        Logger,
        Platform
      ]
    });
    injector = getTestBed();
    service = injector.get(PlatformProvider);
    httpMock = injector.get(HttpTestingController);
  });

  afterEach(() => {
    console.log('before restoring navigator', window.navigator);
    Object.defineProperties(window, {
      navigator: {
        value: navi,
        writable: false
      }
    });
    console.log('after restoring navigator', window.navigator);
  });

  it('should have a dummy user agent', () => {
    let ua = service.ua;
    expect(ua).toBe('dummy user-agent');
  });
});
