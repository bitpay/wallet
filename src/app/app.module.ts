import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { Copay } from './app.component';

import { HomePage } from '../pages/home/home';
import { ReceivePage } from '../pages/receive/receive';
import { SendPage } from '../pages/send/send';
import { SettingPage } from '../pages/setting/setting';
import { TabsPage } from '../pages/tabs/tabs';

import { AboutPage } from '../pages/about/about';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { WalletService } from '../providers/wallet-service/wallet-service';
import { StorageService } from '../providers/storage-service/storage-service';
import { AppService } from '../providers/app-service/app-service';

@NgModule({
  declarations: [
    Copay,
    HomePage,
    ReceivePage,
    SendPage,
    SettingPage,
    AboutPage,
    TabsPage
  ],
  imports: [
    BrowserModule,
    HttpModule,
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
    TabsPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    WalletService,
    StorageService,
    AppService
  ]
})
export class AppModule {}
