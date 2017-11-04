import { Component } from '@angular/core';
import { Platform, ModalController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { Logger } from '@nsalaun/ng-logger';
import { AppProvider } from '../providers/app/app';
import { ProfileProvider } from '../providers/profile/profile';
import { ConfigProvider } from '../providers/config/config';
import { TouchIdProvider } from '../providers/touchid/touchid';

import { TabsPage } from '../pages/tabs/tabs';
import { OnboardingPage } from '../pages/onboarding/onboarding';
import { PinModalPage } from '../pages/pin/pin';
import { FingerprintModalPage } from '../pages/fingerprint/fingerprint';
import { DisclaimerPage } from '../pages/onboarding/disclaimer/disclaimer';

@Component({
  templateUrl: 'app.html',
  providers: [TouchIdProvider]
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
      this.profile.loadAndBindProfile().then((profile: any) => {
        this.openLockModal();
        if (profile) {
          this.logger.info('Profile exists.');
          this.rootPage = TabsPage;
        }
        else {
          this.logger.info('No profile exists.');
          this.profile.createProfile();
          this.rootPage = OnboardingPage;
        }
      }).catch((err: any) => {
        this.logger.warn(err);
        this.rootPage = DisclaimerPage;
      });
    });
  }

  openLockModal() {
    let config: any = this.config.get();
    let lockMethod = config.lock.method;
    if (!lockMethod) return;
    if (lockMethod == 'PIN') this.openPINModal('checkPin');
    if (lockMethod == 'Fingerprint') this.openFingerprintModal();
  }

  openPINModal(action) {
    let modal = this.modalCtrl.create(PinModalPage, { action }, { showBackdrop: false, enableBackdropDismiss: false });
    modal.present();
  }

  openFingerprintModal() {
    let modal = this.modalCtrl.create(FingerprintModalPage, {}, { showBackdrop: false, enableBackdropDismiss: false });
    modal.present();
  }
}
