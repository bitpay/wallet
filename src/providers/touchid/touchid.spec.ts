import { HttpClientModule } from '@angular/common/http';
import { async, TestBed } from '@angular/core/testing';
import { AndroidFingerprintAuth } from '@ionic-native/android-fingerprint-auth';
import { TouchID } from '@ionic-native/touch-id';
import {
  TranslateFakeLoader,
  TranslateLoader,
  TranslateModule
} from '@ngx-translate/core';
import { LoadingController, Platform } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';
import { AppProvider } from '../app/app';
import { ConfigProvider } from '../config/config';
import { LanguageProvider } from '../language/language';
import { PersistenceProvider } from '../persistence/persistence';
import { PlatformProvider } from '../platform/platform';
import { TouchIdProvider } from './touchid';

describe('Provider: TouchId Provider', () => {
  let touchIdProvider: TouchIdProvider;
  let platformProvider: PlatformProvider;
  let configProvider: ConfigProvider;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientModule,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateFakeLoader }
        })
      ],
      providers: [
        AppProvider,
        AndroidFingerprintAuth,
        ConfigProvider,
        LoadingController,
        Logger,
        LanguageProvider,
        { provide: PersistenceProvider },
        Platform,
        PlatformProvider,
        TouchID,
        TouchIdProvider
      ]
    });
    touchIdProvider = TestBed.get(TouchIdProvider);
    platformProvider = TestBed.get(PlatformProvider);
    configProvider = TestBed.get(ConfigProvider);
  });

  describe('Function: isAvailable', () => {
    it('should return false if it not available', () => {
      return touchIdProvider.isAvailable().then(resolve => {
        expect(resolve).toEqual(false);
      });
    });

    it('should return isAvailable value if platform is Android', () => {
      platformProvider.isAndroid = true;
      platformProvider.isCordova = true;
      return touchIdProvider.isAvailable().then(resolve => {
        expect(resolve).toBeDefined();
      });
    });

    it('should return isAvailable value if platform is IOS', () => {
      platformProvider.isIOS = true;
      platformProvider.isCordova = true;
      return touchIdProvider.isAvailable().then(resolve => {
        expect(resolve).toBeDefined();
      });
    });
  });

  describe('Function: check', () => {
    it('should verify is IOS device has Fingerprint', () => {
      platformProvider.isIOS = true;
      platformProvider.isCordova = true;
      touchIdProvider.check().then(resolve => {
        expect(resolve).toBeDefined();
      });
    });

    it('should verify is Android device has Fingerprint', () => {
      platformProvider.isAndroid = true;
      touchIdProvider.check().then(resolve => {
        expect(resolve).toBeDefined();
      });
    });
  });

  describe('Function: checkWallet', () => {
    it('should verify is IOS device has Fingerprint', () => {
      let wallet = {
        isComplete() {
          return false;
        },
        needsBackup: false
      };
      platformProvider.isIOS = true;
      return touchIdProvider.checkWallet(wallet).then(resolve => {
        expect().nothing();
      });
    });
  });
});
