import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule, APP_INITIALIZER } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';

/* Native modules */
import { AndroidFingerprintAuth } from '@ionic-native/android-fingerprint-auth';
import { Clipboard } from '@ionic-native/clipboard';
import { QRScanner } from '@ionic-native/qr-scanner';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { SocialSharing } from '@ionic-native/social-sharing';
import { Toast } from '@ionic-native/toast';
import { TouchID } from '@ionic-native/touch-id';

/* Modules */
import { MomentModule } from 'angular2-moment';
import { NgLoggerModule, Logger, Level } from '@nsalaun/ng-logger';
import { QRCodeModule } from 'angular2-qrcode';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslatePoHttpLoader } from '@biesbjerg/ngx-translate-po-http-loader';

/* Copay App */
import { CopayApp } from './app.component';

/* Pages */
import { TabsPage } from '../pages/tabs/tabs';
import { AddPage } from '../pages/add/add';
import { CreateWalletPage } from '../pages/add/create-wallet/create-wallet';
import { CopayersPage } from '../pages/copayers/copayers';
import { ImportWalletPage } from '../pages/add/import-wallet/import-wallet';
import { JoinWalletPage } from '../pages/add/join-wallet/join-wallet';
import { BackupRequestPage } from '../pages/onboarding/backup-request/backup-request';
import { DisclaimerPage } from '../pages/onboarding/disclaimer/disclaimer';
import { EmailPage } from '../pages/onboarding/email/email';
import { OnboardingPage } from '../pages/onboarding/onboarding';
import { PayProPage } from '../pages/paypro/paypro';
import { TourPage } from '../pages/onboarding/tour/tour';
import { BackupWarningPage } from '../pages/backup/backup-warning/backup-warning';
import { BackupGamePage } from '../pages/backup/backup-game/backup-game';
import { AddressbookPage } from '../pages/addressbook/addressbook';
import { AddressbookAddPage } from '../pages/addressbook/add/add';
import { AddressbookViewPage } from '../pages/addressbook/view/view';
import { WalletDetailsPage } from '../pages/wallet-details/wallet-details';

/* Tabs */
import { HomePage } from '../pages/home/home';
import { ReceivePage } from '../pages/receive/receive';
import { ScanPage } from '../pages/scan/scan';
import { SendPage } from '../pages/send/send';
import { SettingsPage } from '../pages/settings/settings';

/* Settings */
import { AboutPage } from '../pages/settings/about/about';
import { AdvancedPage } from '../pages/settings/advanced/advanced';
import { AltCurrencyPage } from '../pages/settings/alt-currency/alt-currency';
import { FingerprintModalPage } from '../pages/fingerprint/fingerprint';
import { LockPage } from '../pages/settings/lock/lock';
import { PinModalPage } from '../pages/pin/pin';
import { TermsOfUsePage } from '../pages/settings/about/terms-of-use/terms-of-use';

/* Send */
import { AmountPage } from '../pages/send/amount/amount';
import { ConfirmPage } from '../pages/send/confirm/confirm';
import { ChooseFeeLevelPage } from '../pages/choose-fee-level/choose-fee-level';

/* Receive */
import { CustomAmountPage } from '../pages/receive/custom-amount/custom-amount';

/* Providers */

import { AddressBookProvider } from '../providers/address-book/address-book';
import { AppProvider } from '../providers/app/app';
import { BwcProvider } from '../providers/bwc/bwc';
import { BwcErrorProvider } from '../providers/bwc-error/bwc-error';
import { ConfigProvider } from '../providers/config/config';
import { DerivationPathHelperProvider } from '../providers/derivation-path-helper/derivation-path-helper';
import { ExternalLinkProvider } from '../providers/external-link/external-link';
import { FeeProvider } from '../providers/fee/fee';
import { Filter } from '../providers/filter/filter';
import { IncomingDataProvider } from '../providers/incoming-data/incoming-data';
import { LanguageProvider } from '../providers/language/language';
import { NodeWebkitProvider } from '../providers/node-webkit/node-webkit';
import { OnGoingProcessProvider } from '../providers/on-going-process/on-going-process';
import { PayproProvider } from '../providers/paypro/paypro';
import { PersistenceProvider, persistenceProviderFactory } from '../providers/persistence/persistence';
import { PlatformProvider } from '../providers/platform/platform';
import { PopupProvider } from '../providers/popup/popup';
import { ProfileProvider } from '../providers/profile/profile';
import { RateProvider } from '../providers/rate/rate';
import { ReleaseProvider } from '../providers/release/release';
import { ScanProvider } from '../providers/scan/scan';
import { TouchIdProvider } from '../providers/touchid/touchid';
import { TxConfirmNotificationProvider } from '../providers/tx-confirm-notification/tx-confirm-notification';
import { TxFormatProvider } from '../providers/tx-format/tx-format';
import { WalletProvider } from '../providers/wallet/wallet';

/* Directives */

import { CopyToClipboard } from '../directives/copy-to-clipboard/copy-to-clipboard';

export function createTranslateLoader(http: HttpClient) {
  return new TranslatePoHttpLoader(http, 'assets/i18n', '.po');
}

let directives: any = [
  CopyToClipboard
];

let pages: any = [
  AddPage,
  ChooseFeeLevelPage,
  CreateWalletPage,
  CopayersPage,
  ImportWalletPage,
  JoinWalletPage,
  BackupWarningPage,
  BackupGamePage,
  AddressbookPage,
  AddressbookAddPage,
  AddressbookViewPage,
  AboutPage,
  AdvancedPage,
  AltCurrencyPage,
  AmountPage,
  BackupRequestPage,
  ConfirmPage,
  CustomAmountPage,
  CopayApp,
  DisclaimerPage,
  EmailPage,
  FingerprintModalPage,
  HomePage,
  LockPage,
  OnboardingPage,
  PayProPage,
  PinModalPage,
  ReceivePage,
  SendPage,
  ScanPage,
  SettingsPage,
  TermsOfUsePage,
  TourPage,
  TabsPage,
  WalletDetailsPage,
];

let providers: any = [
  AddressBookProvider,
  AndroidFingerprintAuth,
  AppProvider,
  BwcProvider,
  BwcErrorProvider,
  ConfigProvider,
  Clipboard,
  DerivationPathHelperProvider,
  ExternalLinkProvider,
  FeeProvider,
  Filter,
  IncomingDataProvider,
  LanguageProvider,
  NodeWebkitProvider,
  OnGoingProcessProvider,
  PayproProvider,
  PlatformProvider,
  ProfileProvider,
  PopupProvider,
  QRScanner,
  RateProvider,
  ReleaseProvider,
  StatusBar,
  SplashScreen,
  ScanProvider,
  SocialSharing,
  Toast,
  TouchID,
  TouchIdProvider,
  TxConfirmNotificationProvider,
  TxFormatProvider,
  WalletProvider,
  {
    provide: ErrorHandler,
    useClass: IonicErrorHandler
  },
  {
    provide: APP_INITIALIZER,
    useFactory: (app: AppProvider) => () => app.load(),
    deps: [AppProvider],
    multi: true
  },
  {
    provide: PersistenceProvider,
    useFactory: persistenceProviderFactory,
    deps: [PlatformProvider, Logger],
    multi: false
  }
];

export function declarationsComponents() {
  return pages.concat(directives);
}

export function entryComponents() {
  return pages;
}

export function providersComponents() {
  return providers;
}

@NgModule({
  declarations: declarationsComponents(),
  imports: [
    IonicModule.forRoot(CopayApp, {
      tabsHideOnSubPages: true,
      tabsPlacement: 'bottom'
    }),
    BrowserModule,
    HttpClientModule,
    NgLoggerModule.forRoot(Level.LOG),
    MomentModule,
    QRCodeModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient]
      }
    }),
  ],
  bootstrap: [IonicApp],
  entryComponents: entryComponents(),
  providers: providersComponents()
})
export class AppModule { }
