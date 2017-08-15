import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { Logger } from '@nsalaun/ng-logger';
import { AppProvider } from '../providers/app/app';

import { TabsPage } from '../pages/tabs/tabs';

@Component({
  templateUrl: 'app.html'
})
export class CopayApp {
  rootPage: any = TabsPage;

  constructor(
    private platform: Platform,
    private statusBar: StatusBar,
    private splashScreen: SplashScreen,
    private logger: Logger,
    private app: AppProvider
  ) {

    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then((readySource) => {
      this.logger.info(
        'Platform ready (' + readySource + '): ' +
        this.app.info.nameCase +
        ' - v' + this.app.info.version +
        ' #' + this.app.info.commitHash);

      if (this.platform.is('cordova')) {
        this.statusBar.styleLightContent();
        this.splashScreen.hide();
      }
    });
  }
}
