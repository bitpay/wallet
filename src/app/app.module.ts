import { BrowserModule } from '@angular/platform-browser';
import { HttpModule, Http } from '@angular/http';
import { ErrorHandler, NgModule, APP_INITIALIZER } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';

/* Native modules */
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Toast } from '@ionic-native/toast';
import { Clipboard } from '@ionic-native/clipboard';
import { SocialSharing } from '@ionic-native/social-sharing';
import { QRScanner } from '@ionic-native/qr-scanner';

/* Modules */
import { NgLoggerModule, Logger, Level } from '@nsalaun/ng-logger';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslatePoHttpLoader } from '@biesbjerg/ngx-translate-po-http-loader';
import { NgxQRCodeModule } from 'ngx-qrcode2';
import { MomentModule } from 'angular2-moment';

/* Copay App */
import { CopayApp } from './app.component';

/* Pages */
import { TabsPage } from '../pages/tabs/tabs';
import { OnboardingPage } from '../pages/onboarding/onboarding';
import { TourPage } from '../pages/onboarding/tour/tour';
import { EmailPage } from '../pages/onboarding/email/email';
import { BackupRequestPage } from '../pages/onboarding/backup-request/backup-request';
import { DisclaimerPage } from '../pages/onboarding/disclaimer/disclaimer';
/* Tabs */
import { HomePage } from '../pages/home/home';
import { ReceivePage } from '../pages/receive/receive';
import { ScanPage } from '../pages/scan/scan';
import { SendPage } from '../pages/send/send';
import { SettingsPage } from '../pages/settings/settings';
/* Settings */
import { AboutPage } from '../pages/settings/about/about';
import { TermsOfUsePage } from '../pages/settings/about/terms-of-use/terms-of-use';

/* Send */
import { AmountPage } from '../pages/send/amount/amount';
import { ConfirmPage } from '../pages/send/confirm/confirm';

/* Providers */
import { WalletProvider } from '../providers/wallet/wallet';
import { PersistenceProvider, persistenceProviderFactory } from '../providers/persistence/persistence';
import { AppProvider } from '../providers/app/app';
import { PlatformProvider } from '../providers/platform/platform';
import { ConfigProvider } from '../providers/config/config';
import { LanguageProvider } from '../providers/language/language';
import { ScanProvider } from '../providers/scan/scan';
import { ProfileProvider } from '../providers/profile/profile';
import { BwcProvider } from '../providers/bwc/bwc';

export function createTranslateLoader(http: Http) {
  return new TranslatePoHttpLoader(http, 'assets/i18n', '.po');
}

@NgModule({
  declarations: [
    CopayApp,
    HomePage,
    ReceivePage,
    SendPage,
    ScanPage,
    SettingsPage,
    AboutPage,
    TermsOfUsePage,
    OnboardingPage,
    TourPage,
    EmailPage,
    BackupRequestPage,
    DisclaimerPage,
    TabsPage,
    AmountPage,
    ConfirmPage
  ],
  imports: [
    BrowserModule,
    HttpModule,
    NgLoggerModule.forRoot(Level.LOG),
    NgxQRCodeModule,
    MomentModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [Http]
      }
    }),
    IonicModule.forRoot(CopayApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    CopayApp,
    HomePage,
    ReceivePage,
    ScanPage,
    SendPage,
    SettingsPage,
    AboutPage,
    TermsOfUsePage,
    OnboardingPage,
    TourPage,
    EmailPage,
    BackupRequestPage,
    DisclaimerPage,
    TabsPage,
    AmountPage,
    ConfirmPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    Clipboard,
    Toast,
    SocialSharing,
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
    },
    WalletProvider,
    AppProvider,
    PlatformProvider,
    ConfigProvider,
    LanguageProvider,
    QRScanner,
    ScanProvider,
    ProfileProvider,
    BwcProvider
  ]
})
export class AppModule { }
