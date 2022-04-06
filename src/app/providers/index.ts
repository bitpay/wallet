// import { from } from 'rxjs/observable/from';

/* Native modules */
export { Clipboard } from '@ionic-native/clipboard/ngx';
export { Device } from '@ionic-native/device/ngx';
export { FCMNG } from 'fcm-ng';
export { File } from '@ionic-native/file/ngx';
export { FingerprintAIO } from '@ionic-native/fingerprint-aio/ngx';
export { LaunchReview } from '@ionic-native/launch-review/ngx';
export { QRScanner } from '@ionic-native/qr-scanner/ngx';
export { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';
export { SocialSharing } from '@ionic-native/social-sharing/ngx';
export { SplashScreen } from '@ionic-native/splash-screen/ngx';
export { StatusBar } from '@ionic-native/status-bar/ngx';
export { Vibration } from '@ionic-native/vibration/ngx';
export { UserAgent } from '@ionic-native/user-agent/ngx';
export { ThemeDetection } from '@ionic-native/theme-detection/ngx'

/* Providers */
export { EventManagerService } from './event-manager.service';
export { ActionSheetProvider } from './action-sheet/action-sheet';
export { AddressBookProvider } from './address-book/address-book';
export { AddressProvider } from './address/address';
export { AnalyticsProvider } from './analytics/analytics';
export { AppIdentityProvider } from './app-identity/app-identity';
export { AppProvider } from './app/app';
export { BackupProvider } from './backup/backup';
export { BitPayProvider } from './bitpay/bitpay';
export { BwcErrorProvider } from './bwc-error/bwc-error';
export { BwcProvider } from './bwc/bwc';
export { ClipboardProvider } from './clipboard/clipboard';
export { ConfigProvider } from './config/config';
export { CurrencyProvider, Coin } from './currency/currency';
export { DerivationPathHelperProvider } from './derivation-path-helper/derivation-path-helper';
export { DirectoryProvider } from './directory/directory';
export { DomProvider } from './dom/dom';
export { DownloadProvider } from './download/download';
export { DynamicLinksProvider } from './dynamic-links/dynamic-links';
export { EmailNotificationsProvider } from './email-notifications/email-notifications';
export { ErrorsProvider } from './errors/errors';
export { ExternalLinkProvider } from './external-link/external-link';
export { FeeProvider } from './fee/fee';
export { FeedbackProvider } from './feedback/feedback';
export { FilterProvider } from './filter/filter';
export { InAppBrowserProvider } from './in-app-browser/in-app-browser';
export { IncomingDataProvider } from './incoming-data/incoming-data';
export { KeyProvider } from './key/key';
export { LanguageLoader } from './language-loader/language-loader';
export { LanguageProvider } from './language/language';
export { Logger } from './logger/logger';
export { LogsProvider } from './logs/logs';
export { ElectronProvider } from './electron/electron';
export { OnGoingProcessProvider } from './on-going-process/on-going-process';
export { PersistenceProvider } from './persistence/persistence';
export { PlatformProvider } from './platform/platform';
export { PopupProvider } from './popup/popup';
export { ProfileProvider } from './profile/profile';
export { PushNotificationsProvider } from './push-notifications/push-notifications';
export { RateProvider } from './rate/rate';
export { ReplaceParametersProvider } from './replace-parameters/replace-parameters';
export { ScanProvider } from './scan/scan';
export { ThemeProvider } from './theme/theme';
export { TimeProvider } from './time/time';
export { TouchIdProvider } from './touchid/touchid';
export { TxConfirmNotificationProvider } from './tx-confirm-notification/tx-confirm-notification';
export { TxFormatProvider } from './tx-format/tx-format';
export { WalletProvider } from './wallet/wallet';
export { ReleaseProvider } from './release/release';
export { NewFeatureData } from './new-feature-data/new-feature-data';

export { CardPhasesProvider } from './card-phases/card-phases';
export { CustomErrorHandler } from './custom-error-handler.service';

export { RedirectGuard } from './redirect.service';
export { PreviousRouteService } from './previous-route/previous-route';
export { TokenProvider } from './token-sevice/token-sevice';
export { LoadingProvider } from './loading/loading';