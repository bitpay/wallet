// This file is required by karma.conf.js and loads recursively all the .spec and framework files

// tslint:disable:ordered-imports
import 'zone.js/dist/long-stack-trace-zone';
import 'zone.js/dist/proxy.js';
import 'zone.js/dist/sync-test';
import 'zone.js/dist/jasmine-patch';
import 'zone.js/dist/async-test';
import 'zone.js/dist/fake-async-test';
// tslint:enable:ordered-imports

import { DecimalPipe } from '@angular/common';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { getTestBed, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';
import {
  TranslateFakeLoader,
  TranslateLoader,
  TranslateModule,
  TranslateService
} from '@ngx-translate/core';
import { MomentModule } from 'angular2-moment';
import {
  AlertController,
  App,
  Config,
  DeepLinker,
  DomController,
  Events,
  Form,
  GestureController,
  IonicModule,
  Keyboard,
  LoadingController,
  MenuController,
  ModalController,
  NavController,
  NavParams,
  Platform
} from 'ionic-angular';
import {
  AlertControllerMock,
  ConfigMock,
  EventsMock,
  LoadingControllerMock,
  PlatformMock
} from 'ionic-mocks';

import { AndroidFingerprintAuthMock } from '@ionic-native-mocks/android-fingerprint-auth';
import { FCMMock } from '@ionic-native-mocks/fcm';
import { FileMock } from '@ionic-native-mocks/file';
import { QRScannerMock } from '@ionic-native-mocks/qr-scanner';
import { TouchIDMock } from '@ionic-native-mocks/touch-id';
import { AndroidFingerprintAuth } from '@ionic-native/android-fingerprint-auth';
import { FCM } from '@ionic-native/fcm';
import { File } from '@ionic-native/file';
import { QRScanner } from '@ionic-native/qr-scanner';
import { TouchID } from '@ionic-native/touch-id';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { AppProvider } from './providers/app/app';
import { PersistenceProvider } from './providers/persistence/persistence';
import { PlatformProvider } from './providers/platform/platform';

import { SatToFiatPipe } from './pipes/satToFiat';
import { SatToUnitPipe } from './pipes/satToUnit';

import * as appTemplate from './../app-template/bitpay/appConfig.json';

declare const require: any;

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);
// Then we find all the tests.
const context: any = require.context('./', true, /\.spec\.ts$/);
// And load the modules.
context.keys().map(context);

export class TestUtils {
  public static beforeEachCompiler(
    components: any[]
  ): Promise<{ fixture: any; instance: any }> {
    return TestUtils.configureIonicTestingModule(components)
      .compileComponents()
      .then(() => {
        const fixture: any = TestBed.createComponent(components[0]);
        return {
          fixture,
          instance: fixture.debugElement.componentInstance
        };
      });
  }

  public static configureIonicTestingModule(components: any[]): typeof TestBed {
    return TestBed.configureTestingModule({
      declarations: [...components],
      imports: [FormsModule, IonicModule, ReactiveFormsModule, TranslateModule],
      providers: [
        App,
        Form,
        Keyboard,
        DomController,
        MenuController,
        NavController,
        { provide: Platform, useFactory: () => PlatformMock.instance() },
        { provide: Config, useFactory: () => ConfigMock.instance() },
        { provide: DeepLinker, useFactory: () => ConfigMock.instance() }
      ]
    });
  }

  public static async configurePageTestingModule(
    components: any[],
    otherParams: any
  ): Promise<{ fixture: any; instance: any; testBed: typeof TestBed }> {
    const providers = (otherParams && otherParams.providers) || [];
    await TestBed.configureTestingModule({
      declarations: [...components, SatToFiatPipe, SatToUnitPipe],
      imports: [
        FormsModule,
        IonicModule,
        MomentModule,
        ReactiveFormsModule,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateFakeLoader }
        }),
        HttpClientTestingModule
      ],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        AlertController,
        App,
        AppProvider,
        DecimalPipe,
        SatToFiatPipe,
        SatToUnitPipe,
        Events,
        Form,
        GestureController,
        Keyboard,
        DomController,
        LoadingController,
        MenuController,
        ModalController,
        NavController,
        NavParams,
        PlatformProvider,
        TranslateService,
        {
          provide: Platform,
          useFactory: () => {
            const instance = PlatformMock.instance();
            instance.is.and.returnValue(false);
            instance.resume = new Subject();
            return instance;
          }
        },
        { provide: Config, useFactory: () => ConfigMock.instance() },
        { provide: DeepLinker, useFactory: () => ConfigMock.instance() },
        { provide: FCM, useClass: FCMMock },
        { provide: File, useClass: FileMock },
        { provide: QRScanner, useClass: QRScannerMock },
        { provide: TouchID, useClass: TouchIDMock },
        {
          provide: AndroidFingerprintAuth,
          useClass: AndroidFingerprintAuthMock
        },
        ...providers
      ]
    }).compileComponents();
    const appProvider = TestBed.get(AppProvider);
    spyOn(appProvider, 'getAppInfo').and.returnValue(
      Promise.resolve(appTemplate)
    );
    spyOn(appProvider, 'getServicesInfo').and.returnValue(Promise.resolve({}));
    await appProvider.load();
    const fixture: any = TestBed.createComponent(components[0]);
    return {
      fixture,
      instance: fixture.debugElement.componentInstance,
      testBed: TestBed
    };
  }

  // http://stackoverflow.com/questions/2705583/how-to-simulate-a-click-with-javascript
  public static eventFire(el: any, etype: string): void {
    if (el.fireEvent) {
      el.fireEvent('on' + etype);
    } else {
      const evObj: any = document.createEvent('Events');
      evObj.initEvent(etype, true, false);
      el.dispatchEvent(evObj);
    }
  }
}
