import { Component } from '@angular/core';
import { Platform, ModalController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

//providers
import { Logger } from '@nsalaun/ng-logger';
import { AppProvider } from '../providers/app/app';
import { ProfileProvider } from '../providers/profile/profile';
import { ConfigProvider } from '../providers/config/config';
import { TouchIdProvider } from '../providers/touchid/touchid';
import { GlideraProvider } from '../providers/glidera/glidera';
import { CoinbaseProvider } from '../providers/coinbase/coinbase';
import { AmazonProvider } from '../providers/amazon/amazon';
import { BitPayCardProvider } from '../providers/bitpay-card/bitpay-card';
import { MercadoLibreProvider } from '../providers/mercado-libre/mercado-libre';
import { ShapeshiftProvider } from '../providers/shapeshift/shapeshift';

//pages
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
    private configProvider: ConfigProvider,
    private modalCtrl: ModalController,
    private glideraProvider: GlideraProvider,
    private coinbaseProvider: CoinbaseProvider,
    private amazonProvider: AmazonProvider,
    private bitPayCardProvider: BitPayCardProvider,
    private mercadoLibreProvider: MercadoLibreProvider,
    private shapeshiftProvider: ShapeshiftProvider,
  ) {

    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then((readySource) => {
      this.app.load().then(() => {
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
          this.registerIntegrations();
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
      }).catch((err) => {
        console.log('[app.component.ts:68] NO PUDO INICIAR LA APP', err); //TODO
      });

    });
  }

  private openLockModal(): void {
    let config: any = this.configProvider.get();
    let lockMethod = config.lock.method;
    if (!lockMethod) return;
    if (lockMethod == 'PIN') this.openPINModal('checkPin');
    if (lockMethod == 'Fingerprint') this.openFingerprintModal();
  }

  private openPINModal(action): void {
    let modal = this.modalCtrl.create(PinModalPage, { action }, { showBackdrop: false, enableBackdropDismiss: false });
    modal.present();
  }

  private openFingerprintModal(): void {
    let modal = this.modalCtrl.create(FingerprintModalPage, {}, { showBackdrop: false, enableBackdropDismiss: false });
    modal.present();
  }

  private registerIntegrations(): void {
    this.mercadoLibreProvider.register();
    this.bitPayCardProvider.register();
    this.amazonProvider.register();
    this.glideraProvider.setCredentials();
    this.glideraProvider.register();
    this.coinbaseProvider.setCredentials();
    this.coinbaseProvider.register();
    this.shapeshiftProvider.register();
  }
}
