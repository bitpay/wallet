import { Component, Renderer, ViewChild } from '@angular/core';
import { Device } from '@ionic-native/device';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { UserAgent } from '@ionic-native/user-agent';
import {
  Config,
  Events,
  ModalController,
  NavController,
  Platform
} from 'ionic-angular';
import { ImageLoaderConfig } from 'ionic-image-loader';
import { Observable, Subscription } from 'rxjs';

// Providers
import {
  BitPayProvider,
  GiftCardProvider,
  IABCardProvider,
  InAppBrowserProvider,
  PersistenceProvider
} from '../providers';
import { AppProvider } from '../providers/app/app';
import { BitPayCardProvider } from '../providers/bitpay-card/bitpay-card';
import { CoinbaseProvider } from '../providers/coinbase/coinbase';
import { ConfigProvider } from '../providers/config/config';
import { EmailNotificationsProvider } from '../providers/email-notifications/email-notifications';
import { IncomingDataProvider } from '../providers/incoming-data/incoming-data';
import { KeyProvider } from '../providers/key/key';
import { Logger } from '../providers/logger/logger';
import { Network } from '../providers/persistence/persistence';
import { PlatformProvider } from '../providers/platform/platform';
import { PopupProvider } from '../providers/popup/popup';
import { ProfileProvider } from '../providers/profile/profile';
import { PushNotificationsProvider } from '../providers/push-notifications/push-notifications';
import { ShapeshiftProvider } from '../providers/shapeshift/shapeshift';
import { SimplexProvider } from '../providers/simplex/simplex';
import { TouchIdProvider } from '../providers/touchid/touchid';

// Pages
import { CARD_IAB_CONFIG } from '../constants';
import { AddWalletPage } from '../pages/add-wallet/add-wallet';
import { CopayersPage } from '../pages/add/copayers/copayers';
import { ImportWalletPage } from '../pages/add/import-wallet/import-wallet';
import { JoinWalletPage } from '../pages/add/join-wallet/join-wallet';
import { FingerprintModalPage } from '../pages/fingerprint/fingerprint';
import { BitPayCardIntroPage } from '../pages/integrations/bitpay-card/bitpay-card-intro/bitpay-card-intro';
import { CoinbasePage } from '../pages/integrations/coinbase/coinbase';
import { SelectInvoicePage } from '../pages/integrations/invoice/select-invoice/select-invoice';
import { ShapeshiftPage } from '../pages/integrations/shapeshift/shapeshift';
import { SimplexPage } from '../pages/integrations/simplex/simplex';
import { DisclaimerPage } from '../pages/onboarding/disclaimer/disclaimer';
import { OnboardingPage } from '../pages/onboarding/onboarding';
import { PaperWalletPage } from '../pages/paper-wallet/paper-wallet';
import { PinModalPage } from '../pages/pin/pin-modal/pin-modal';
import { AmountPage } from '../pages/send/amount/amount';
import { ConfirmPage } from '../pages/send/confirm/confirm';
import { AddressbookAddPage } from '../pages/settings/addressbook/add/add';
import { TabsPage } from '../pages/tabs/tabs';
import { WalletDetailsPage } from '../pages/wallet-details/wallet-details';
// As the handleOpenURL handler kicks in before the App is started,
// declare the handler function at the top of app.component.ts (outside the class definition)
// to track the passed Url
(window as any).handleOpenURL = (url: string) => {
  (window as any).handleOpenURL_LastURL = url;
};

@Component({
  templateUrl: 'app.html',
  providers: [TouchIdProvider]
})
export class CopayApp {
  @ViewChild('appNav')
  nav: NavController;
  cardIAB_Ref: InAppBrowser;
  NETWORK = 'livenet';
  public rootPage:
    | typeof AmountPage
    | typeof DisclaimerPage
    | typeof TabsPage
    | typeof OnboardingPage;
  private onResumeSubscription: Subscription;
  private isCopayerModalOpen: boolean;
  private copayerModal: any;

  private pageMap = {
    AddressbookAddPage,
    AmountPage,
    BitPayCardIntroPage,
    CoinbasePage,
    ConfirmPage,
    CopayersPage,
    ImportWalletPage,
    JoinWalletPage,
    AddWalletPage,
    PaperWalletPage,
    ShapeshiftPage,
    SimplexPage,
    SelectInvoicePage,
    WalletDetailsPage
  };

  constructor(
    private config: Config,
    private platform: Platform,
    private platformProvider: PlatformProvider,
    private statusBar: StatusBar,
    private splashScreen: SplashScreen,
    private events: Events,
    private logger: Logger,
    private appProvider: AppProvider,
    private profile: ProfileProvider,
    private configProvider: ConfigProvider,
    private giftCardProvider: GiftCardProvider,
    private imageLoaderConfig: ImageLoaderConfig,
    private modalCtrl: ModalController,
    private coinbaseProvider: CoinbaseProvider,
    private bitPayCardProvider: BitPayCardProvider,
    private shapeshiftProvider: ShapeshiftProvider,
    private simplexProvider: SimplexProvider,
    private emailNotificationsProvider: EmailNotificationsProvider,
    private screenOrientation: ScreenOrientation,
    private popupProvider: PopupProvider,
    private pushNotificationsProvider: PushNotificationsProvider,
    private incomingDataProvider: IncomingDataProvider,
    private renderer: Renderer,
    private userAgent: UserAgent,
    private device: Device,
    private keyProvider: KeyProvider,
    private persistenceProvider: PersistenceProvider,
    private iab: InAppBrowserProvider,
    private iabCardProvider: IABCardProvider,
    private bitpayProvider: BitPayProvider
  ) {
    this.imageLoaderConfig.setFileNameCachedWithExtension(true);
    this.imageLoaderConfig.useImageTag(true);
    this.imageLoaderConfig.enableSpinner(false);
    this.initializeApp();
  }

  ngOnDestroy() {
    this.onResumeSubscription.unsubscribe();
    if (this.iab) {
      Object.keys(this.iab.refs).forEach(ref => {
        this.iab.refs[ref].close();
      });
    }
  }

  initializeApp() {
    this.config.set('backButtonIcon', 'tab-button-back');
    this.platform
      .ready()
      .then(readySource => {
        this.onPlatformReady(readySource);
      })
      .catch(e => {
        this.logger.error('Platform is not ready.', e);
      });
  }

  private onPlatformReady(readySource): void {
    this.appProvider
      .load()
      .then(() => {
        this.onAppLoad(readySource);
      })
      .catch(err => {
        const title = 'Could not initialize the app';
        let message;
        try {
          message = err instanceof Error ? err.toString() : JSON.stringify(err);
        } catch (error) {
          message = 'Unknown error';
        }
        this.popupProvider.ionicAlert(title, message);
      });
  }

  private async onAppLoad(readySource) {
    const deviceInfo = this.platformProvider.getDeviceInfo();
    const experiment = await this.persistenceProvider.getCardExperimentFlag();
    this.bitpayProvider.init(experiment);

    this.logger.info(
      'Platform ready (' +
        readySource +
        '): ' +
        this.appProvider.info.nameCase +
        ' - v' +
        this.appProvider.info.version +
        ' #' +
        this.appProvider.info.commitHash +
        deviceInfo
    );

    if (this.platform.is('cordova')) {
      this.statusBar.show();

      // Set User-Agent
      this.userAgent.set(
        this.appProvider.info.name +
          ' ' +
          this.appProvider.info.version +
          ' (' +
          this.device.platform +
          ' ' +
          this.device.version +
          ' - ' +
          this.device.model +
          ')'
      );

      // Set to portrait
      this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT);

      // Only overlay for iOS
      if (this.platform.is('ios')) this.statusBar.overlaysWebView(true);

      this.statusBar.styleDefault();
      this.splashScreen.hide();

      // Subscribe Resume
      this.onResumeSubscription = this.platform.resume.subscribe(() => {
        // Check PIN or Fingerprint on Resume
        this.openLockModal();

        // Clear all notifications
        this.pushNotificationsProvider.clearAllNotifications();
      });

      // Check PIN or Fingerprint
      this.openLockModal();

      // Clear all notifications
      this.pushNotificationsProvider.clearAllNotifications();
    }

    this.registerIntegrations();
    this.incomingDataRedirEvent();
    this.events.subscribe('OpenWallet', (wallet, params) =>
      this.openWallet(wallet, params)
    );
    this.keyProvider
      .load()
      .then(() => {
        // Check Profile
        this.profile
          .loadAndBindProfile()
          .then(profile => {
            this.onProfileLoad(profile);
          })
          .catch((err: Error) => {
            switch (err.message) {
              case 'NONAGREEDDISCLAIMER':
                this.logger.warn('Non agreed disclaimer');
                this.rootPage = DisclaimerPage;
                break;
              default:
                this.popupProvider.ionicAlert(
                  'Could not initialize the app',
                  err.message
                );
            }
          });
      })
      .catch(err => {
        this.popupProvider.ionicAlert('Error loading keys', err.message || '');
        this.logger.error('Error loading keys: ', err);
      });
    // hiding this behind feature flag
    if (experiment === 'enabled') {
      let token;
      try {
        token = await this.persistenceProvider.getBitPayIdPairingToken(
          Network[this.NETWORK]
        );
      } catch (err) {
        this.logger.log(err);
      }
      // preloading the view
      setTimeout(() => {
        this.iab
          .createIABInstance(
            'card',
            CARD_IAB_CONFIG,
            'https://test.bitpay.com/wallet-card',
            `sessionStorage.setItem('isPaired', ${!!token})`
          )
          .then(ref => {
            this.cardIAB_Ref = ref;
            this.iabCardProvider.init();
          });
      });
    }
  }

  private onProfileLoad(profile) {
    this.emailNotificationsProvider.init(); // Update email subscription if necessary
    this.initPushNotifications();

    if (profile) {
      this.logger.info('Profile exists.');

      this.rootPage = TabsPage;

      if (this.platform.is('cordova')) {
        this.handleDeepLinks();
      }

      if (this.platformProvider.isElectron) {
        this.handleDeepLinksElectron();
      }
    } else {
      this.logger.info('No profile exists.');
      this.profile.createProfile();
      this.rootPage = OnboardingPage;
    }
  }

  private openLockModal(): void {
    if (this.appProvider.isLockModalOpen) return;
    const config = this.configProvider.get();
    const lockMethod =
      config && config.lock && config.lock.method
        ? config.lock.method.toLowerCase()
        : null;
    if (!lockMethod) return;
    if (lockMethod == 'pin') this.openPINModal('checkPin');
    if (lockMethod == 'fingerprint') this.openFingerprintModal();
  }

  private openPINModal(action): void {
    this.appProvider.isLockModalOpen = true;
    const modal = this.modalCtrl.create(
      PinModalPage,
      { action },
      {
        enableBackdropDismiss: false,
        cssClass: 'fullscreen-modal'
      }
    );
    modal.present({ animate: false });
    modal.onDidDismiss(() => {
      this.appProvider.isLockModalOpen = false;
      this.events.publish('Home/reloadStatus');
    });
  }

  private openFingerprintModal(): void {
    this.appProvider.isLockModalOpen = true;
    const modal = this.modalCtrl.create(
      FingerprintModalPage,
      {},
      {
        enableBackdropDismiss: false,
        cssClass: 'fullscreen-modal'
      }
    );
    modal.present({ animate: false });
    modal.onDidDismiss(() => {
      this.appProvider.isLockModalOpen = false;
      this.events.publish('Home/reloadStatus');
    });
  }

  private registerIntegrations(): void {
    // Gift Cards
    if (this.appProvider.info._enabledExtensions.giftcards)
      this.giftCardProvider.register();

    // ShapeShift
    if (this.appProvider.info._enabledExtensions.shapeshift) {
      this.shapeshiftProvider.setCredentials();
      this.shapeshiftProvider.register();
    }

    // Simplex
    if (this.appProvider.info._enabledExtensions.simplex) {
      this.simplexProvider.register();
    }

    // Coinbase
    if (this.appProvider.info._enabledExtensions.coinbase) {
      this.coinbaseProvider.setCredentials();
      this.coinbaseProvider.register();
    }

    // BitPay Card
    if (this.appProvider.info._enabledExtensions.debitcard)
      this.bitPayCardProvider.register();
  }

  private incomingDataRedirEvent(): void {
    this.events.subscribe('IncomingDataRedir', nextView => {
      this.closeScannerFromWithinWallet();
      // wait for wallets status
      setTimeout(() => {
        const globalNav = this.getGlobalTabs().getSelected();
        globalNav.push(this.pageMap[nextView.name], nextView.params);
      }, 300);
    });
  }

  private openWallet(wallet, params) {
    if (wallet.isComplete()) {
      this.getGlobalTabs().select(1);
      this.nav.push(WalletDetailsPage, {
        ...params,
        walletId: wallet.credentials.walletId
      });
    } else {
      // check if modal is already open
      if (this.isCopayerModalOpen) {
        this.copayerModal.dismiss();
      }
      this.isCopayerModalOpen = true;
      this.copayerModal = this.modalCtrl.create(
        CopayersPage,
        {
          ...params,
          walletId: wallet.credentials.walletId
        },
        {
          cssClass: 'wallet-details-modal'
        }
      );
      this.copayerModal.present();
      this.copayerModal.onDidDismiss(() => {
        this.isCopayerModalOpen = false;
      });
    }
  }

  private async closeScannerFromWithinWallet() {
    if (!this.getWalletDetailsModal()) {
      return;
    }
    await this.toggleScannerVisibilityFromWithinWallet(false, 300);
  }

  private toggleScannerVisibilityFromWithinWallet(
    visible: boolean,
    transitionDuration: number
  ): Promise<number> {
    const walletDetailsModal = this.getWalletDetailsModal();
    this.renderer.setElementClass(walletDetailsModal, 'scanning', visible);
    return Observable.timer(transitionDuration).toPromise();
  }

  private getWalletDetailsModal(): Element {
    return document.getElementsByClassName('wallet-details-modal')[0];
  }

  private initPushNotifications() {
    this.pushNotificationsProvider.init();
  }

  private handleDeepLinks() {
    // Check if app was resume by custom url scheme
    (window as any).handleOpenURL = (url: string) => {
      this.logger.info('App was resumed by custom url scheme');
      this.handleOpenUrl(url);
    };

    // Check if app was opened by custom url scheme
    const lastUrl: string = (window as any).handleOpenURL_LastURL || '';
    if (lastUrl && lastUrl !== '') {
      delete (window as any).handleOpenURL_LastURL;
      // Important delay to have all views loaded before process URL
      setTimeout(() => {
        this.logger.info('App was opened by custom url scheme');
        this.handleOpenUrl(lastUrl);
      }, 2000);
    }
  }

  private handleOpenUrl(url: string) {
    if (!this.incomingDataProvider.redir(url)) {
      this.logger.warn('Unknown URL! : ' + url);
    }
  }

  private handleDeepLinksElectron() {
    const electron = (window as any).require('electron');
    electron.ipcRenderer.on('open-url-event', (_, url) => {
      this.processUrl(url);
    });
  }

  private processUrl(pathData): void {
    if (pathData.indexOf('bitcoincash:/') != -1) {
      this.logger.debug('Bitcoin Cash URL found');
      this.handleOpenUrl(pathData.substring(pathData.indexOf('bitcoincash:/')));
    } else if (pathData.indexOf('bitcoin:/') != -1) {
      this.logger.debug('Bitcoin URL found');
      this.handleOpenUrl(pathData.substring(pathData.indexOf('bitcoin:/')));
    } else if (pathData.indexOf(this.appProvider.info.name + '://') != -1) {
      this.logger.debug(this.appProvider.info.name + ' URL found');
      this.handleOpenUrl(
        pathData.substring(pathData.indexOf(this.appProvider.info.name + '://'))
      );
    } else {
      this.logger.debug('URL found');
      this.handleOpenUrl(pathData);
    }
  }

  private getGlobalTabs() {
    return this.nav.getActiveChildNavs()[0].viewCtrl.instance.tabs;
  }
}
