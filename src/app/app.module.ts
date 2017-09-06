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

/* Copay App */
import { CopayApp } from './app.component';

/* Pages */
import { TabsPage } from '../pages/tabs/tabs';
/* Tabs */
import { HomePage } from '../pages/home/home';
import { ReceivePage } from '../pages/receive/receive';
import { ScanPage } from '../pages/scan/scan';
import { SendPage } from '../pages/send/send';
import { SettingsPage } from '../pages/settings/settings';
/* Settings */
import { AboutPage } from '../pages/settings/about/about';
import { TermsOfUsePage } from '../pages/settings/about/terms-of-use/terms-of-use';

/* Providers */
import { WalletProvider } from '../providers/wallet/wallet';
import { PersistenceProvider, persistenceProviderFactory } from '../providers/persistence/persistence';
import { AppProvider } from '../providers/app/app';
import { PlatformProvider } from '../providers/platform/platform';
import { ConfigProvider } from '../providers/config/config';
import { LanguageProvider } from '../providers/language/language';
import { UnitProvider } from '../providers/unit/unit';
import { ScanProvider } from '../providers/scan/scan';

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
    TabsPage
  ],
  imports: [
    BrowserModule,
    HttpModule,
    NgLoggerModule.forRoot(Level.LOG),
    NgxQRCodeModule,
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
    TabsPage
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
      multi: true
    },
    WalletProvider,
    AppProvider,
    PlatformProvider,
    ConfigProvider,
    LanguageProvider,
    UnitProvider,
    QRScanner,
    ScanProvider
  ]
})
export class AppModule { }
