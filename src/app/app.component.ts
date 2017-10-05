import { Component } from '@angular/core';
import { Platform, ModalController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { Logger } from '@nsalaun/ng-logger';
import { AppProvider } from '../providers/app/app';
import { ProfileProvider } from '../providers/profile/profile';
import { ConfigProvider } from '../providers/config/config';

import { TabsPage } from '../pages/tabs/tabs';
import { OnboardingPage } from '../pages/onboarding/onboarding';
import { PinModalPage } from '../pages/pin/pin';

@Component({
  templateUrl: 'app.html'
})
export class CopayApp {
  rootPage: any;

  constructor(
    private platform: Platform,
    private statusBar: StatusBar,
    private splashScreen: SplashScreen,
    private logger: Logger,
    private app: AppProvider,
    private profile: ProfileProvider,
    private config: ConfigProvider,
    private modalCtrl: ModalController
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
      // Check Profile
      this.profile.get().then((profile: any) => {
        if (profile) {
          this.logger.info('Profile read. Go to HomePage.');
          this.openLockModal();
          this.rootPage = TabsPage;
        } else {
          // TODO: go to onboarding page
          this.logger.warn('Profile does not exist. Go to Onboarding.');
          this.rootPage = OnboardingPage;
        }
      });
    });
  }

  openLockModal() {
    let config = this.config.get();
    let lockMethod = config['lock'] && config['lock']['method'];
    if (!config['lock']['method']) return;
    if (config['lock']['method'] == 'PIN') this.openPINModal('checkPin');
  }

  openPINModal(action) {
    let modal = this.modalCtrl.create(PinModalPage, { action }, { showBackdrop: false, enableBackdropDismiss: false });
    modal.present();
  }
}
