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

/* Modules */
import { NgLoggerModule, Logger, Level } from '@nsalaun/ng-logger';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslatePoHttpLoader } from '@biesbjerg/ngx-translate-po-http-loader';
import { NgxQRCodeModule } from 'ngx-qrcode2';

/* Copay App */
import { CopayApp } from './app.component';

/* Pages */
import { HomePage } from '../pages/home/home';
import { ReceivePage } from '../pages/receive/receive';
import { SendPage } from '../pages/send/send';
import { SettingPage } from '../pages/setting/setting';
import { TabsPage } from '../pages/tabs/tabs';

import { AboutPage } from '../pages/about/about';
import { TermsOfUsePage } from '../pages/terms-of-use/terms-of-use';

/* Providers */
import { WalletProvider } from '../providers/wallet/wallet';
import { PersistenceProvider, persistenceProviderFactory } from '../providers/persistence/persistence';
import { AppProvider } from '../providers/app/app';
import { PlatformProvider } from '../providers/platform/platform';

export function createTranslateLoader(http: Http) {
  return new TranslatePoHttpLoader(http, './assets/i18n/', '.po');
}

@NgModule({
  declarations: [
    CopayApp,
    HomePage,
    ReceivePage,
    SendPage,
    SettingPage,
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
    SendPage,
    SettingPage,
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
      provide: PersistenceProvider,
      useFactory: persistenceProviderFactory,
      deps: [PlatformProvider, Logger],
      multi: true
    },
    WalletProvider,
    AppProvider,
    PlatformProvider
  ]
})
export class AppModule { }
