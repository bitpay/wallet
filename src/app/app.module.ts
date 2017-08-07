import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule, Http } from '@angular/http';

import { NgLoggerModule, Level } from '@nsalaun/ng-logger';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslatePoHttpLoader } from '@biesbjerg/ngx-translate-po-http-loader';

import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { Copay } from './app.component';

import { HomePage } from '../pages/home/home';
import { ReceivePage } from '../pages/receive/receive';
import { SendPage } from '../pages/send/send';
import { SettingPage } from '../pages/setting/setting';
import { TabsPage } from '../pages/tabs/tabs';

import { AboutPage } from '../pages/about/about';
import { TermsOfUsePage } from '../pages/terms-of-use/terms-of-use';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { WalletProvider } from '../providers/wallet/wallet';
import { PersistenceProvider } from '../providers/persistence/persistence';
import { AppProvider } from '../providers/app/app';
import { PlatformProvider } from '../providers/platform/platform';

export function createTranslateLoader(http: Http) {
    return new TranslatePoHttpLoader(http, './assets/i18n/', '.po');
}

@NgModule({
  declarations: [
    Copay,
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
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [Http]
      }
    }),
    IonicModule.forRoot(Copay)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    Copay,
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
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    WalletProvider,
    PersistenceProvider,
    AppProvider,
    PlatformProvider
  ]
})
export class AppModule { }
