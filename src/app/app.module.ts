import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { DecimalPipe } from '@angular/common';
import { File } from '@ionic-native/file';

/* Native modules */
import { AndroidFingerprintAuth } from '@ionic-native/android-fingerprint-auth';
import { Clipboard } from '@ionic-native/clipboard';
import { QRScanner } from '@ionic-native/qr-scanner';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { SocialSharing } from '@ionic-native/social-sharing';
import { Toast } from '@ionic-native/toast';
import { TouchID } from '@ionic-native/touch-id';
import { FCM } from '@ionic-native/fcm';

/* Modules */
import { MomentModule } from 'angular2-moment';
import { NgLoggerModule, Level } from '@nsalaun/ng-logger';
import { NgxQRCodeModule } from '@techiediaries/ngx-qrcode';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslatePoHttpLoader } from '@biesbjerg/ngx-translate-po-http-loader';

/* Copay App */
import { CopayApp } from './app.component';

/* Pages */
import { TabsPage } from '../pages/tabs/tabs';
import { AddPage } from '../pages/add/add';
import { BitcoinCashPage } from '../pages/settings/bitcoin-cash/bitcoin-cash';
import { BackupRequestPage } from '../pages/onboarding/backup-request/backup-request';
import { BackupWarningPage } from '../pages/backup/backup-warning/backup-warning';
import { BackupGamePage } from '../pages/backup/backup-game/backup-game';
import { CreateWalletPage } from '../pages/add/create-wallet/create-wallet';
import { CopayersPage } from '../pages/add/copayers/copayers';
import { DisclaimerPage } from '../pages/onboarding/disclaimer/disclaimer';
import { CollectEmailPage } from '../pages/onboarding/collect-email/collect-email';
import { FeeWarningPage } from '../pages/send/fee-warning/fee-warning';
import { IncomingDataMenuPage } from '../pages/incoming-data-menu/incoming-data-menu';
import { ImportWalletPage } from '../pages/add/import-wallet/import-wallet';
import { JoinWalletPage } from '../pages/add/join-wallet/join-wallet';
import { OnboardingPage } from '../pages/onboarding/onboarding';
import { PaperWalletPage } from '../pages/paper-wallet/paper-wallet';
import { PayProPage } from '../pages/paypro/paypro';
import { FeedbackPage } from '../pages/feedback/feedback/feedback';
import { FeedbackCompletePage } from '../pages/feedback/feedback-complete/feedback-complete';
import { TourPage } from '../pages/onboarding/tour/tour';
import { WalletDetailsPage } from '../pages/wallet-details/wallet-details';
import { TxDetailsPage } from '../pages/tx-details/tx-details';
import { TxpDetailsPage } from '../pages/txp-details/txp-details';
import { SendFeedbackPage } from '../pages/feedback/send-feedback/send-feedback';
import { SuccessModalPage } from '../pages/success/success';

// Integrations: Amazon
import { AmazonCardDetailsPage } from '../pages/integrations/amazon/amazon-card-details/amazon-card-details';
import { AmazonPage } from '../pages/integrations/amazon/amazon';
import { BuyAmazonPage } from '../pages/integrations/amazon/buy-amazon/buy-amazon';

// Integrations: Coinbase
import { BuyCoinbasePage } from '../pages/integrations/coinbase/buy-coinbase/buy-coinbase';
import { CoinbasePage } from '../pages/integrations/coinbase/coinbase';
import { CoinbaseTxDetailsPage } from '../pages/integrations/coinbase/coinbase-tx-details/coinbase-tx-details';
import { SellCoinbasePage } from '../pages/integrations/coinbase/sell-coinbase/sell-coinbase';

// Integrations: Glidera
import { BuyGlideraPage } from '../pages/integrations/glidera/buy-glidera/buy-glidera';
import { GlideraPage } from '../pages/integrations/glidera/glidera';
import { GlideraTxDetailsPage } from '../pages/integrations/glidera/modal/glidera-tx-details';
import { SellGlideraPage } from '../pages/integrations/glidera/sell-glidera/sell-glidera';

// Integrations: Mercado Libre
import { BuyMercadoLibrePage } from '../pages/integrations/mercado-libre/buy-mercado-libre/buy-mercado-libre';
import { MercadoLibreCardDetailsPage } from '../pages/integrations/mercado-libre/mercado-libre-card-details/mercado-libre-card-details';
import { MercadoLibrePage } from '../pages/integrations/mercado-libre/mercado-libre';

// Integrations: ShapeShift
import { ShapeshiftConfirmPage } from '../pages/integrations/shapeshift/shapeshift-confirm/shapeshift-confirm';
import { ShapeshiftDetailsPage } from '../pages/integrations/shapeshift/shapeshift-details/shapeshift-details';
import { ShapeshiftPage } from '../pages/integrations/shapeshift/shapeshift';
import { ShapeshiftShiftPage } from '../pages/integrations/shapeshift/shapeshift-shift/shapeshift-shift';

/*Includes */
import { FeedbackCardPage } from '../pages/includes/feedback-card/feedback-card';
import { GravatarPage } from '../pages/includes/gravatar/gravatar';
import { TxpPage } from '../pages/includes/txp/txp';
import { WalletItemPage } from '../pages/includes/wallet-item/wallet-item';
import { WalletActivityPage } from '../pages/includes/wallet-activity/wallet-activity';
import { WalletSelectorPage } from '../pages/includes/wallet-selector/wallet-selector';

/* Tabs */
import { HomePage } from '../pages/home/home';
import { ReceivePage } from '../pages/receive/receive';
import { ScanPage } from '../pages/scan/scan';
import { SendPage } from '../pages/send/send';
import { SettingsPage } from '../pages/settings/settings';

/* Home */
import { ActivityPage } from '../pages/home/activity/activity';
import { ProposalsPage } from '../pages/home/proposals/proposals';

/* Settings */
import { AboutPage } from '../pages/settings/about/about';
import { AddressbookPage } from '../pages/settings/addressbook/addressbook';
import { AddressbookAddPage } from '../pages/settings/addressbook/add/add';
import { AddressbookViewPage } from '../pages/settings/addressbook/view/view';
import { AdvancedPage } from '../pages/settings/advanced/advanced';
import { AltCurrencyPage } from '../pages/settings/alt-currency/alt-currency';
import { FingerprintModalPage } from '../pages/fingerprint/fingerprint';
import { LanguagePage } from '../pages/settings/language/language';
import { LockPage } from '../pages/settings/lock/lock';
import { PinModalPage } from '../pages/pin/pin';
import { TermsOfUsePage } from '../pages/settings/about/terms-of-use/terms-of-use';
import { NotificationsPage } from '../pages/settings/notifications/notifications';
import { FeePolicyPage } from '../pages/settings/fee-policy/fee-policy';
import { SessionLogPage } from '../pages/settings/about/session-log/session-log';

/* Wallet Settings */
import { WalletSettingsPage } from '../pages/settings/wallet-settings/wallet-settings';
import { WalletNamePage } from '../pages/settings/wallet-settings/wallet-name/wallet-name';
import { WalletColorPage } from '../pages/settings/wallet-settings/wallet-color/wallet-color';

/* Wallet Advanced Settings */
import { WalletSettingsAdvancedPage } from '../pages/settings/wallet-settings/wallet-settings-advanced/wallet-settings-advanced';
import { WalletInformationPage } from '../pages/settings/wallet-settings/wallet-settings-advanced/wallet-information/wallet-information';
import { WalletAddressesPage } from '../pages/settings/wallet-settings/wallet-settings-advanced/wallet-addresses/wallet-addresses';
import { WalletExportPage } from '../pages/settings/wallet-settings/wallet-settings-advanced/wallet-export/wallet-export';
import { WalletServiceUrlPage } from '../pages/settings/wallet-settings/wallet-settings-advanced/wallet-service-url/wallet-service-url';
import { WalletTransactionHistoryPage } from '../pages/settings/wallet-settings/wallet-settings-advanced/wallet-transaction-history/wallet-transaction-history';
import { WalletDeletePage } from '../pages/settings/wallet-settings/wallet-settings-advanced/wallet-delete/wallet-delete';
import { WalletExtendedPrivateKeyPage } from '../pages/settings/wallet-settings/wallet-settings-advanced/wallet-information/wallet-extended-private-key/wallet-extended-private-key';
import { AllAddressesPage } from '../pages/settings/wallet-settings/wallet-settings-advanced/wallet-addresses/all-addresses/all-addresses';

/* Send */
import { AmountPage } from '../pages/send/amount/amount';
import { ConfirmPage } from '../pages/send/confirm/confirm';
import { ChooseFeeLevelPage } from '../pages/send/choose-fee-level/choose-fee-level';

/* Receive */
import { CustomAmountPage } from '../pages/receive/custom-amount/custom-amount';

/* Pipes */
import { SatToUnitPipe } from '../pipes/satToUnit';
import { SatToFiatPipe } from '../pipes/satToFiat';
import { FiatToUnitPipe } from '../pipes/fiatToUnit';
import { KeysPipe } from '../pipes/keys';

/* Providers */
import { AddressProvider } from '../providers/address/address';
import { AddressBookProvider } from '../providers/address-book/address-book';
import { AppProvider } from '../providers/app/app';
import { AppIdentityProvider } from '../providers/app-identity/app-identity';
import { AmazonProvider } from '../providers/amazon/amazon';
import { BackupProvider } from '../providers/backup/backup';
import { BitPayProvider } from '../providers/bitpay/bitpay';
import { BitPayCardProvider } from '../providers/bitpay-card/bitpay-card';
import { BwcProvider } from '../providers/bwc/bwc';
import { BwcErrorProvider } from '../providers/bwc-error/bwc-error';
import { ConfigProvider } from '../providers/config/config';
import { CoinbaseProvider } from '../providers/coinbase/coinbase';
import { DerivationPathHelperProvider } from '../providers/derivation-path-helper/derivation-path-helper';
import { ExternalLinkProvider } from '../providers/external-link/external-link';
import { FeedbackProvider } from '../providers/feedback/feedback';
import { FeeProvider } from '../providers/fee/fee';
import { GlideraProvider } from '../providers/glidera/glidera';
import { HomeIntegrationsProvider } from '../providers/home-integrations/home-integrations';
import { IncomingDataProvider } from '../providers/incoming-data/incoming-data';
import { LanguageProvider } from '../providers/language/language';
import { Logger } from '../providers/logger/logger';
import { MercadoLibreProvider } from '../providers/mercado-libre/mercado-libre';
import { NodeWebkitProvider } from '../providers/node-webkit/node-webkit';
import { OnGoingProcessProvider } from '../providers/on-going-process/on-going-process';
import { PayproProvider } from '../providers/paypro/paypro';
import { PersistenceProvider } from '../providers/persistence/persistence';
import { PlatformProvider } from '../providers/platform/platform';
import { PopupProvider } from '../providers/popup/popup';
import { ProfileProvider } from '../providers/profile/profile';
import { PushNotificationsProvider } from '../providers/push-notifications/push-notifications';
import { RateProvider } from '../providers/rate/rate';
import { ReleaseProvider } from '../providers/release/release';
import { ShapeshiftProvider } from '../providers/shapeshift/shapeshift';
import { ScanProvider } from '../providers/scan/scan';
import { TimeProvider } from '../providers/time/time';
import { TouchIdProvider } from '../providers/touchid/touchid';
import { TxConfirmNotificationProvider } from '../providers/tx-confirm-notification/tx-confirm-notification';
import { TxFormatProvider } from '../providers/tx-format/tx-format';
import { FilterProvider } from '../providers/filter/filter';
import { WalletProvider } from '../providers/wallet/wallet';
import { EmailNotificationsProvider } from '../providers/email-notifications/email-notifications';

/* Directives */
import { CopyToClipboard } from '../directives/copy-to-clipboard/copy-to-clipboard';
import { LongPress } from '../directives/long-press/long-press';
import { NoLowFee } from '../directives/no-low-fee/no-low-fee'

export function createTranslateLoader(http: HttpClient) {
  return new TranslatePoHttpLoader(http, 'assets/i18n', '.po');
}

let directives: any = [
  CopyToClipboard,
  LongPress,
  NoLowFee
];

let pages: any = [
  ActivityPage,
  AddPage,
  AmazonCardDetailsPage,
  AmazonPage,
  AmountPage,
  AddressbookPage,
  AddressbookAddPage,
  AddressbookViewPage,
  AboutPage,
  AdvancedPage,
  AllAddressesPage,
  AltCurrencyPage,
  BackupRequestPage,
  BitcoinCashPage,
  BuyAmazonPage,
  BuyCoinbasePage,
  BuyGlideraPage,
  BuyMercadoLibrePage,
  ChooseFeeLevelPage,
  CreateWalletPage,
  CoinbasePage,
  CoinbaseTxDetailsPage,
  CopayersPage,
  FeedbackCardPage,
  FeedbackPage,
  FeedbackCompletePage,
  IncomingDataMenuPage,
  ImportWalletPage,
  JoinWalletPage,
  BackupWarningPage,
  BackupGamePage,
  ConfirmPage,
  CustomAmountPage,
  CopayApp,
  DisclaimerPage,
  CollectEmailPage,
  FeeWarningPage,
  GlideraPage,
  GravatarPage,
  FingerprintModalPage,
  HomePage,
  LanguagePage,
  LockPage,
  MercadoLibrePage,
  OnboardingPage,
  PaperWalletPage,
  PayProPage,
  GlideraTxDetailsPage,
  PinModalPage,
  ProposalsPage,
  ReceivePage,
  ScanPage,
  SendPage,
  SettingsPage,
  SellCoinbasePage,
  SellGlideraPage,
  ShapeshiftConfirmPage,
  ShapeshiftDetailsPage,
  ShapeshiftPage,
  ShapeshiftShiftPage,
  TermsOfUsePage,
  MercadoLibreCardDetailsPage,
  NotificationsPage,
  FeePolicyPage,
  SessionLogPage,
  SendFeedbackPage,
  SuccessModalPage,
  TourPage,
  TabsPage,
  TxpDetailsPage,
  TxDetailsPage,
  TxpPage,
  WalletSettingsPage,
  WalletSettingsAdvancedPage,
  WalletNamePage,
  WalletColorPage,
  WalletInformationPage,
  WalletAddressesPage,
  WalletExportPage,
  WalletServiceUrlPage,
  WalletTransactionHistoryPage,
  WalletDeletePage,
  WalletExtendedPrivateKeyPage,
  WalletDetailsPage,
  WalletItemPage,
  WalletActivityPage,
  WalletSelectorPage
];

let providers: any = [
  AddressProvider,
  AddressBookProvider,
  AndroidFingerprintAuth,
  AppProvider,
  AppIdentityProvider,
  AmazonProvider,
  BackupProvider,
  BitPayProvider,
  BitPayCardProvider,
  BwcProvider,
  BwcErrorProvider,
  ConfigProvider,
  CoinbaseProvider,
  Clipboard,
  DerivationPathHelperProvider,
  ExternalLinkProvider,
  FeedbackProvider,
  FCM,
  HomeIntegrationsProvider,
  FeeProvider,
  GlideraProvider,
  IncomingDataProvider,
  LanguageProvider,
  Logger,
  MercadoLibreProvider,
  NodeWebkitProvider,
  OnGoingProcessProvider,
  PayproProvider,
  PlatformProvider,
  ProfileProvider,
  PopupProvider,
  QRScanner,
  PushNotificationsProvider,
  RateProvider,
  ReleaseProvider,
  ShapeshiftProvider,
  StatusBar,
  SplashScreen,
  ScanProvider,
  SocialSharing,
  Toast,
  TouchID,
  TimeProvider,
  TouchIdProvider,
  TxConfirmNotificationProvider,
  FilterProvider,
  TxFormatProvider,
  WalletProvider,
  EmailNotificationsProvider,
  DecimalPipe,
  PersistenceProvider,
  File,
  {
    provide: ErrorHandler,
    useClass: IonicErrorHandler
  }
];

let pipes = [
  SatToUnitPipe,
  SatToFiatPipe,
  FiatToUnitPipe,
  KeysPipe
];

export function declarationsComponents() {
  let declarations = [];

  declarations = declarations.concat(pages);
  declarations = declarations.concat(directives);
  declarations = declarations.concat(pipes);

  return declarations;
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
    NgxQRCodeModule,
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
