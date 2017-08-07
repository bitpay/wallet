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
export class Copay {
  rootPage: any = TabsPage;

  constructor(
    platform: Platform,
    statusBar: StatusBar,
    splashScreen: SplashScreen,
    log: Logger,
    app: AppProvider
  ) {
    platform.ready().then(() => {
      app.getName().subscribe((name) => {
        log.info('Name: ' + name);
      });
      app.getVersion().subscribe((version) => {
        log.info('Version: ' + version);
      });
      app.getCommitHash().subscribe((commit) => {
        log.info('Commit Hash: #' + commit);
      });
      log.info('Platform: ' + platform.platforms());
      log.info('Language: ' + platform.lang());
      if (platform.is('cordova')) {
        statusBar.styleDefault();
        splashScreen.hide();
      }
    });
  }
}
