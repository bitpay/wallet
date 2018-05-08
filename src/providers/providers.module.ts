import { NgModule } from '@angular/core';

import { DecimalPipe } from '@angular/common';

/* Native modules */
import { AndroidFingerprintAuth } from '@ionic-native/android-fingerprint-auth';
import { Clipboard } from '@ionic-native/clipboard';
import { Device } from '@ionic-native/device';
import { FCM } from '@ionic-native/fcm';
import { File } from '@ionic-native/file';
import { QRScanner } from '@ionic-native/qr-scanner';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { SocialSharing } from '@ionic-native/social-sharing';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { Toast } from '@ionic-native/toast';
import { TouchID } from '@ionic-native/touch-id';

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
import { ReplaceParametersProvider } from '../providers/replace-parameters/replace-parameters';
import { ScanProvider } from '../providers/scan/scan';
import { ShapeshiftProvider } from '../providers/shapeshift/shapeshift';
import { TimeProvider } from '../providers/time/time';
import { TouchIdProvider } from '../providers/touchid/touchid';
import { TxConfirmNotificationProvider } from '../providers/tx-confirm-notification/tx-confirm-notification';
import { TxFormatProvider } from '../providers/tx-format/tx-format';
import { WalletProvider } from '../providers/wallet/wallet';

@NgModule({
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
    ReplaceParametersProvider,
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
    File
  ]
})
export class ProvidersModule {}
