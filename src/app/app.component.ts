import { Component } from '@angular/core';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { ModalController, Platform } from 'ionic-angular';
import { Subscription } from 'rxjs';

//providers
import { AmazonProvider } from '../providers/amazon/amazon';
import { AppProvider } from '../providers/app/app';
import { BitPayCardProvider } from '../providers/bitpay-card/bitpay-card';
import { CoinbaseProvider } from '../providers/coinbase/coinbase';
import { ConfigProvider } from '../providers/config/config';
import { GlideraProvider } from '../providers/glidera/glidera';
import { Logger } from '../providers/logger/logger';
import { MercadoLibreProvider } from '../providers/mercado-libre/mercado-libre';
import { ProfileProvider } from '../providers/profile/profile';
import { ShapeshiftProvider } from '../providers/shapeshift/shapeshift';
import { TouchIdProvider } from '../providers/touchid/touchid';

//pages
import { FingerprintModalPage } from '../pages/fingerprint/fingerprint';
import { DisclaimerPage } from '../pages/onboarding/disclaimer/disclaimer';
import { OnboardingPage } from '../pages/onboarding/onboarding';
import { PinModalPage } from '../pages/pin/pin';
import { TabsPage } from '../pages/tabs/tabs';

@Component({
  templateUrl: 'app.html',
  providers: [TouchIdProvider]
})
export class CopayApp {

  public rootPage: any;
  private onResumeSubscription: Subscription;
  private isModalOpen: boolean;

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
    private shapeshiftProvider: ShapeshiftProvider
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
          this.statusBar.show();

          // Only overlay for iOS
          if (this.platform.is('ios')) this.statusBar.overlaysWebView(true);

          this.statusBar.styleLightContent();
          this.splashScreen.hide();
        }
        //Check PIN or Fingerprint
        this.onResumeSubscription = this.platform.resume.subscribe(() => {
          this.openLockModal();
        });
        this.openLockModal();
        // Check Profile
        this.profile.loadAndBindProfile().then((profile: any) => {
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
        this.logger.error('Could not initialize the app');
      });

    });
  }

  ngOnDestroy() {
    this.onResumeSubscription.unsubscribe();
  }

  private openLockModal(): void {
    if (this.isModalOpen) return;
    let config: any = this.configProvider.get();
    let lockMethod = config.lock.method;
    if (!lockMethod) return;
    if (lockMethod == 'PIN') this.openPINModal('checkPin');
    if (lockMethod == 'Fingerprint') this.openFingerprintModal();
  }

  private openPINModal(action): void {
    this.isModalOpen = true;
    let modal = this.modalCtrl.create(PinModalPage, { action }, { showBackdrop: false, enableBackdropDismiss: false });
    modal.present();
    modal.onDidDismiss(() => {
      this.isModalOpen = false;
    });
  }

  private openFingerprintModal(): void {
    this.isModalOpen = true;
    let modal = this.modalCtrl.create(FingerprintModalPage, {}, { showBackdrop: false, enableBackdropDismiss: false });
    modal.present();
    modal.onDidDismiss(() => {
      this.isModalOpen = false;
    });
  }

  private registerIntegrations(): void {

    // Mercado Libre
    if (this.app.info._enabledExtensions.mercadolibre) this.mercadoLibreProvider.register();

    // Amazon Gift Cards
    if (this.app.info._enabledExtensions.amazon) this.amazonProvider.register();

    // ShapeShift
    if (this.app.info._enabledExtensions.shapeshift) this.shapeshiftProvider.register();

    // Glidera
    if (this.app.info._enabledExtensions.glidera) {
      this.glideraProvider.setCredentials();
      this.glideraProvider.register();
    }

    // Coinbase
    if (this.app.info._enabledExtensions.coinbase) {
      this.coinbaseProvider.setCredentials();
      this.coinbaseProvider.register();
    }

    // BitPay Card
    if (this.app.info._enabledExtensions.debitcard) this.bitPayCardProvider.register();
  }
}
