import { async, TestBed } from '@angular/core/testing';

// providers
import { DecimalPipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { AndroidFingerprintAuth } from '@ionic-native/android-fingerprint-auth';
import { File } from '@ionic-native/file';
import { TouchID } from '@ionic-native/touch-id';
import {
  TranslateFakeLoader,
  TranslateLoader,
  TranslateModule,
  TranslateService
} from '@ngx-translate/core';
import {
  AlertController,
  App,
  Config,
  Events,
  LoadingController,
  Platform
} from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';
import { AppProvider } from '../app/app';
import { BwcErrorProvider } from '../bwc-error/bwc-error';
import { BwcProvider } from '../bwc/bwc';
import { ConfigProvider } from '../config/config';
import { FeeProvider } from '../fee/fee';
import { FilterProvider } from '../filter/filter';
import { LanguageProvider } from '../language/language';
import { OnGoingProcessProvider } from '../on-going-process/on-going-process';
import { PersistenceProvider } from '../persistence/persistence';
import { PlatformProvider } from '../platform/platform';
import { PopupProvider } from '../popup/popup';
import { ProfileProvider } from '../profile/profile';
import { RateProvider } from '../rate/rate';
import { ReplaceParametersProvider } from '../replace-parameters/replace-parameters';
import { TouchIdProvider } from '../touchid/touchid';
import { TxFormatProvider } from '../tx-format/tx-format';
import { WalletProvider } from '../wallet/wallet';
import { EmailNotificationsProvider } from './email-notifications';

describe('Provider: Wallet Provider', () => {
  let emailNotificationsProvider: EmailNotificationsProvider;
  let configProvider: ConfigProvider;
  let persistenceProvider: PersistenceProvider;
  let walletProvider: WalletProvider;
  let profileProvider: ProfileProvider;

  let opts = {
    enabled: true,
    email: 'test@bitpay.com'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule, TranslateModule.forRoot({})],
      providers: [
        AppProvider,
        AlertController,
        AndroidFingerprintAuth,
        App,
        BwcErrorProvider,
        BwcProvider,
        Config,
        ConfigProvider,
        DecimalPipe,
        FeeProvider,
        EmailNotificationsProvider,
        Events,
        File,
        FilterProvider,
        LoadingController,
        Logger,
        LanguageProvider,
        OnGoingProcessProvider,
        { provide: PersistenceProvider },
        PersistenceProvider,
        Platform,
        PlatformProvider,
        PopupProvider,
        ProfileProvider,
        RateProvider,
        TouchID,
        TouchIdProvider,
        TranslateService,
        TxFormatProvider,
        WalletProvider,
        ReplaceParametersProvider
      ]
    });
    configProvider = TestBed.get(ConfigProvider);
    emailNotificationsProvider = TestBed.get(EmailNotificationsProvider);
    persistenceProvider = TestBed.get(PersistenceProvider);
    persistenceProvider.load();
    walletProvider = TestBed.get(WalletProvider);
    profileProvider = TestBed.get(ProfileProvider);
  });

  describe('updateEmail function', () => {
    it('should exit function if options has not email', () => {
      let optsWithoutEmail = {
        enabled: true,
        email: ''
      };
      expect(
        emailNotificationsProvider.updateEmail(optsWithoutEmail)
      ).toBeUndefined();
    });

    it('should update email if options has an email', () => {
      emailNotificationsProvider.updateEmail(opts);
      expect(configProvider.get().emailNotifications).toEqual(opts);
    });

    it('should update remote preferences', () => {
      jasmine.clock().install();
      emailNotificationsProvider.updateEmail(opts);
      jasmine.clock().tick(1001);
      let wallets = profileProvider.getWallets();
      walletProvider.updateRemotePreferences(wallets).then(address => {
        expect().nothing();
      });
      jasmine.clock().uninstall();
    });
  });

  describe('getEmailIfEnabled function', () => {
    it('should exit if has not email enabled', () => {
      let optsDisabled = {
        enabled: false,
        email: ''
      };

      configProvider.set(optsDisabled);
      expect(emailNotificationsProvider.getEmailIfEnabled()).toBeUndefined();
    });

    it('should return email', () => {
      emailNotificationsProvider.updateEmail(opts);
      expect(emailNotificationsProvider.getEmailIfEnabled()).toEqual(
        'test@bitpay.com'
      );
    });
  });

  describe('init function', () => {
    it('should return if email already set', () => {
      emailNotificationsProvider.updateEmail(opts);
      expect(emailNotificationsProvider.init()).toBeUndefined();
    });

    it('should return if config is empty', () => {
      let emptyOpts = {};
      configProvider.set(emptyOpts);
      expect(emailNotificationsProvider.init()).toBeUndefined();
    });
  });
});
