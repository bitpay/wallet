import { DecimalPipe } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { File } from '@ionic-native/file';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';

/* Native modules */
import { AndroidFingerprintAuth } from '@ionic-native/android-fingerprint-auth';
import { Clipboard } from '@ionic-native/clipboard';
import { Device } from '@ionic-native/device';
import { FCM } from '@ionic-native/fcm';
import { QRScanner } from '@ionic-native/qr-scanner';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { SocialSharing } from '@ionic-native/social-sharing';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { Toast } from '@ionic-native/toast';
import { TouchID } from '@ionic-native/touch-id';

/* Modules */
import { TranslatePoHttpLoader } from '@biesbjerg/ngx-translate-po-http-loader';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { MomentModule } from 'angular2-moment';
import { NgxQRCodeModule } from 'ngx-qrcode2';

/* Copay App */
import env from '../environments';
import { CopayApp } from './app.component';

/* Pages */
import { AddPage } from '../pages/add/add';
import { CopayersPage } from '../pages/add/copayers/copayers';
import { CreateWalletPage } from '../pages/add/create-wallet/create-wallet';
import { ImportWalletPage } from '../pages/add/import-wallet/import-wallet';
import { JoinWalletPage } from '../pages/add/join-wallet/join-wallet';
import { BackupGamePage } from '../pages/backup/backup-game/backup-game';
import { BackupNeededModalPage } from '../pages/backup/backup-needed-modal/backup-needed-modal';
import { BackupReadyModalPage } from '../pages/backup/backup-ready-modal/backup-ready-modal';
import { BackupWarningModalPage } from '../pages/backup/backup-warning-modal/backup-warning-modal';
import { BackupWarningPage } from '../pages/backup/backup-warning/backup-warning';
import { FeedbackCompletePage } from '../pages/feedback/feedback-complete/feedback-complete';
import { FeedbackPage } from '../pages/feedback/feedback/feedback';
import { SendFeedbackPage } from '../pages/feedback/send-feedback/send-feedback';
import { FinishModalPage } from '../pages/finish/finish';
import { BackupRequestPage } from '../pages/onboarding/backup-request/backup-request';
import { CollectEmailPage } from '../pages/onboarding/collect-email/collect-email';
import { DisclaimerPage } from '../pages/onboarding/disclaimer/disclaimer';
import { OnboardingPage } from '../pages/onboarding/onboarding';
import { TourPage } from '../pages/onboarding/tour/tour';
import { PaperWalletPage } from '../pages/paper-wallet/paper-wallet';
import { PayProPage } from '../pages/paypro/paypro';
import { FeeWarningPage } from '../pages/send/fee-warning/fee-warning';
import { BitcoinCashPage } from '../pages/settings/bitcoin-cash/bitcoin-cash';
import { SlideToAcceptPage } from '../pages/slide-to-accept/slide-to-accept';
import { TabsPage } from '../pages/tabs/tabs';
import { TxDetailsPage } from '../pages/tx-details/tx-details';
import { TxpDetailsPage } from '../pages/txp-details/txp-details';
import { WalletBalancePage } from '../pages/wallet-details/wallet-balance/wallet-balance';
import { WalletDetailsPage } from '../pages/wallet-details/wallet-details';

// Integrations: Amazon
import { AmazonPage } from '../pages/integrations/amazon/amazon';
import { AmazonCardDetailsPage } from '../pages/integrations/amazon/amazon-card-details/amazon-card-details';
import { AmazonSettingsPage } from '../pages/integrations/amazon/amazon-settings/amazon-settings';
import { BuyAmazonPage } from '../pages/integrations/amazon/buy-amazon/buy-amazon';

// Integrations: Coinbase
import { BuyCoinbasePage } from '../pages/integrations/coinbase/buy-coinbase/buy-coinbase';
import { CoinbasePage } from '../pages/integrations/coinbase/coinbase';
import { CoinbaseSettingsPage } from '../pages/integrations/coinbase/coinbase-settings/coinbase-settings';
import { CoinbaseTxDetailsPage } from '../pages/integrations/coinbase/coinbase-tx-details/coinbase-tx-details';
import { SellCoinbasePage } from '../pages/integrations/coinbase/sell-coinbase/sell-coinbase';

// Integrations: Glidera
import { BuyGlideraPage } from '../pages/integrations/glidera/buy-glidera/buy-glidera';
import { GlideraPage } from '../pages/integrations/glidera/glidera';
import { GlideraSettingsPage } from '../pages/integrations/glidera/glidera-settings/glidera-settings';
import { GlideraTxDetailsPage } from '../pages/integrations/glidera/glidera-tx-details/glidera-tx-details';
import { SellGlideraPage } from '../pages/integrations/glidera/sell-glidera/sell-glidera';

// Integrations: Mercado Libre
import { BuyMercadoLibrePage } from '../pages/integrations/mercado-libre/buy-mercado-libre/buy-mercado-libre';
import { MercadoLibrePage } from '../pages/integrations/mercado-libre/mercado-libre';
import { MercadoLibreCardDetailsPage } from '../pages/integrations/mercado-libre/mercado-libre-card-details/mercado-libre-card-details';
import { MercadoLibreSettingsPage } from '../pages/integrations/mercado-libre/mercado-libre-settings/mercado-libre-settings';

// Integrations: ShapeShift
import { ShapeshiftPage } from '../pages/integrations/shapeshift/shapeshift';
import { ShapeshiftConfirmPage } from '../pages/integrations/shapeshift/shapeshift-confirm/shapeshift-confirm';
import { ShapeshiftDetailsPage } from '../pages/integrations/shapeshift/shapeshift-details/shapeshift-details';
import { ShapeshiftSettingsPage } from '../pages/integrations/shapeshift/shapeshift-settings/shapeshift-settings';
import { ShapeshiftShiftPage } from '../pages/integrations/shapeshift/shapeshift-shift/shapeshift-shift';

// Integrations: BitPayCard
import { BitPayCardPage } from '../pages/integrations/bitpay-card/bitpay-card';
import { BitPayCardIntroPage } from '../pages/integrations/bitpay-card/bitpay-card-intro/bitpay-card-intro';
import { BitPayCardTopUpPage } from '../pages/integrations/bitpay-card/bitpay-card-topup/bitpay-card-topup';
import { BitPaySettingsPage } from '../pages/integrations/bitpay-card/bitpay-settings/bitpay-settings';

/*Includes */
import { CardItemPage } from '../pages/includes/card-item/card-item';
import { FeedbackCardPage } from '../pages/includes/feedback-card/feedback-card';
import { GravatarPage } from '../pages/includes/gravatar/gravatar';
import { IncomingDataMenuPage } from '../pages/includes/incoming-data-menu/incoming-data-menu';
import { TxpPage } from '../pages/includes/txp/txp';
import { WalletActivityPage } from '../pages/includes/wallet-activity/wallet-activity';
import { WalletItemPage } from '../pages/includes/wallet-item/wallet-item';
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
import { FingerprintModalPage } from '../pages/fingerprint/fingerprint';
import { PinModalPage } from '../pages/pin/pin';
import { AboutPage } from '../pages/settings/about/about';
import { SessionLogPage } from '../pages/settings/about/session-log/session-log';
import { TermsOfUsePage } from '../pages/settings/about/terms-of-use/terms-of-use';
import { AddressbookAddPage } from '../pages/settings/addressbook/add/add';
import { AddressbookPage } from '../pages/settings/addressbook/addressbook';
import { AddressbookViewPage } from '../pages/settings/addressbook/view/view';
import { AdvancedPage } from '../pages/settings/advanced/advanced';
import { AltCurrencyPage } from '../pages/settings/alt-currency/alt-currency';
import { FeePolicyPage } from '../pages/settings/fee-policy/fee-policy';
import { LanguagePage } from '../pages/settings/language/language';
import { LockPage } from '../pages/settings/lock/lock';
import { NotificationsPage } from '../pages/settings/notifications/notifications';

/* Wallet Settings */
import { WalletColorPage } from '../pages/settings/wallet-settings/wallet-color/wallet-color';
import { WalletNamePage } from '../pages/settings/wallet-settings/wallet-name/wallet-name';
import { WalletSettingsPage } from '../pages/settings/wallet-settings/wallet-settings';

/* Wallet Advanced Settings */
import { AllAddressesPage } from '../pages/settings/wallet-settings/wallet-settings-advanced/wallet-addresses/all-addresses/all-addresses';
import { WalletAddressesPage } from '../pages/settings/wallet-settings/wallet-settings-advanced/wallet-addresses/wallet-addresses';
import { WalletDeletePage } from '../pages/settings/wallet-settings/wallet-settings-advanced/wallet-delete/wallet-delete';
import { WalletExportPage } from '../pages/settings/wallet-settings/wallet-settings-advanced/wallet-export/wallet-export';
import { WalletExtendedPrivateKeyPage } from '../pages/settings/wallet-settings/wallet-settings-advanced/wallet-information/wallet-extended-private-key/wallet-extended-private-key';
import { WalletInformationPage } from '../pages/settings/wallet-settings/wallet-settings-advanced/wallet-information/wallet-information';
import { WalletServiceUrlPage } from '../pages/settings/wallet-settings/wallet-settings-advanced/wallet-service-url/wallet-service-url';
import { WalletSettingsAdvancedPage } from '../pages/settings/wallet-settings/wallet-settings-advanced/wallet-settings-advanced';
import { WalletTransactionHistoryPage } from '../pages/settings/wallet-settings/wallet-settings-advanced/wallet-transaction-history/wallet-transaction-history';

/* Send */
import { AmountPage } from '../pages/send/amount/amount';
import { ChooseFeeLevelPage } from '../pages/send/choose-fee-level/choose-fee-level';
import { ConfirmPage } from '../pages/send/confirm/confirm';

/* Receive */
import { CustomAmountPage } from '../pages/receive/custom-amount/custom-amount';

/* Pipes */
import { FiatToUnitPipe } from '../pipes/fiatToUnit';
import { KeysPipe } from '../pipes/keys';
import { OrderByPipe } from '../pipes/order-by';
import { SatToFiatPipe } from '../pipes/satToFiat';
import { SatToUnitPipe } from '../pipes/satToUnit';

/* Providers */
import { AddressBookProvider } from '../providers/address-book/address-book';
import { AddressProvider } from '../providers/address/address';
import { AmazonProvider } from '../providers/amazon/amazon';
import { AppIdentityProvider } from '../providers/app-identity/app-identity';
import { AppProvider } from '../providers/app/app';
import { BackupProvider } from '../providers/backup/backup';
import { BitPayAccountProvider } from '../providers/bitpay-account/bitpay-account';
import { BitPayCardProvider } from '../providers/bitpay-card/bitpay-card';
import { BitPayProvider } from '../providers/bitpay/bitpay';
import { BwcErrorProvider } from '../providers/bwc-error/bwc-error';
import { BwcProvider } from '../providers/bwc/bwc';
import { CoinbaseProvider } from '../providers/coinbase/coinbase';
import { ConfigProvider } from '../providers/config/config';
import { DerivationPathHelperProvider } from '../providers/derivation-path-helper/derivation-path-helper';
import { EmailNotificationsProvider } from '../providers/email-notifications/email-notifications';
import { ExternalLinkProvider } from '../providers/external-link/external-link';
import { FeeProvider } from '../providers/fee/fee';
import { FeedbackProvider } from '../providers/feedback/feedback';
import { FilterProvider } from '../providers/filter/filter';
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
import { ScanProvider } from '../providers/scan/scan';
import { ShapeshiftProvider } from '../providers/shapeshift/shapeshift';
import { TimeProvider } from '../providers/time/time';
import { TouchIdProvider } from '../providers/touchid/touchid';
import { TxConfirmNotificationProvider } from '../providers/tx-confirm-notification/tx-confirm-notification';
import { TxFormatProvider } from '../providers/tx-format/tx-format';
import { WalletProvider } from '../providers/wallet/wallet';

/* Directives */
import { CopyToClipboard } from '../directives/copy-to-clipboard/copy-to-clipboard';
import { IosScrollBgColor } from '../directives/ios-scroll-bg-color/ios-scroll-bg-color';
import { LongPress } from '../directives/long-press/long-press';
import { NavbarBg } from '../directives/navbar-bg/navbar-bg';
import { NoLowFee } from '../directives/no-low-fee/no-low-fee';

/* Components */
import { ComponentsModule } from './../components/components.module';

/* Read translation files */
export function createTranslateLoader(http: HttpClient) {
  return new TranslatePoHttpLoader(http, 'assets/i18n/po', '.po');
}

@NgModule({
  declarations: [
    /* Pages */
    ActivityPage,
    AddPage,
    AmazonCardDetailsPage,
    AmazonPage,
    AmazonSettingsPage,
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
    BitPayCardIntroPage,
    BitPayCardPage,
    BitPaySettingsPage,
    BitPayCardTopUpPage,
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
    BackupWarningModalPage,
    BackupWarningPage,
    BackupReadyModalPage,
    BackupNeededModalPage,
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
    MercadoLibreSettingsPage,
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
    GlideraSettingsPage,
    CoinbaseSettingsPage,
    ShapeshiftConfirmPage,
    ShapeshiftDetailsPage,
    ShapeshiftSettingsPage,
    ShapeshiftPage,
    ShapeshiftShiftPage,
    TermsOfUsePage,
    MercadoLibreCardDetailsPage,
    NotificationsPage,
    FeePolicyPage,
    SessionLogPage,
    SendFeedbackPage,
    FinishModalPage,
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
    WalletBalancePage,
    WalletItemPage,
    WalletActivityPage,
    WalletSelectorPage,
    CardItemPage,
    SlideToAcceptPage,
    /* Directives */
    CopyToClipboard,
    IosScrollBgColor,
    LongPress,
    NavbarBg,
    NoLowFee,
    /* Pipes */
    SatToUnitPipe,
    SatToFiatPipe,
    FiatToUnitPipe,
    KeysPipe,
    OrderByPipe
  ],
  imports: [
    IonicModule.forRoot(CopayApp, {
      animate: env.enableAnimations,
      tabsHideOnSubPages: true,
      tabsPlacement: 'bottom',
      backButtonIcon: 'arrow-round-back',
      backButtonText: ''
    }),
    BrowserModule,
    ComponentsModule,
    HttpClientModule,
    MomentModule,
    NgxQRCodeModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient]
      }
    }),
    ZXingScannerModule.forRoot()
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    /* Pages */
    ActivityPage,
    AddPage,
    AmazonCardDetailsPage,
    AmazonPage,
    AmazonSettingsPage,
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
    BitPayCardIntroPage,
    BitPayCardPage,
    BitPaySettingsPage,
    BitPayCardTopUpPage,
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
    BackupWarningModalPage,
    BackupWarningPage,
    BackupReadyModalPage,
    BackupNeededModalPage,
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
    MercadoLibreSettingsPage,
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
    GlideraSettingsPage,
    CoinbaseSettingsPage,
    ShapeshiftConfirmPage,
    ShapeshiftDetailsPage,
    ShapeshiftSettingsPage,
    ShapeshiftPage,
    ShapeshiftShiftPage,
    TermsOfUsePage,
    MercadoLibreCardDetailsPage,
    NotificationsPage,
    FeePolicyPage,
    SessionLogPage,
    SendFeedbackPage,
    FinishModalPage,
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
    WalletBalancePage,
    WalletItemPage,
    WalletActivityPage,
    WalletSelectorPage,
    CardItemPage,
    SlideToAcceptPage
  ],
  providers: [
    AddressProvider,
    AddressBookProvider,
    AndroidFingerprintAuth,
    AppProvider,
    AppIdentityProvider,
    AmazonProvider,
    BackupProvider,
    BitPayProvider,
    BitPayCardProvider,
    BitPayAccountProvider,
    BwcProvider,
    BwcErrorProvider,
    ConfigProvider,
    CoinbaseProvider,
    Clipboard,
    DerivationPathHelperProvider,
    Device,
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
    ScreenOrientation,
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
  ]
})
export class AppModule {}
