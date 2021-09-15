import { Component, Renderer2, ViewChild } from '@angular/core';
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
  AddressBookProvider,
  AnalyticsProvider,
  AppProvider,
  ConfigProvider,
  DynamicLinksProvider,
  EmailNotificationsProvider,
  InAppBrowserProvider,
  IncomingDataProvider,
  KeyProvider,
  Logger,
  LogsProvider,
  PlatformProvider,
  PopupProvider,
  ProfileProvider,
  PushNotificationsProvider,
  ThemeProvider,
  TouchIdProvider,
} from '../providers';

import {
  PersistenceProvider
} from '../providers/persistence/persistence';

// Pages
import { AddWalletPage } from '../pages/add-wallet/add-wallet';
import { CopayersPage } from '../pages/add/copayers/copayers';
import { ImportWalletPage } from '../pages/add/import-wallet/import-wallet';
import { JoinWalletPage } from '../pages/add/join-wallet/join-wallet';
import { FingerprintModalPage } from '../pages/fingerprint/fingerprint';
import { DisclaimerPage } from '../pages/onboarding/disclaimer/disclaimer';
import { FeatureEducationPage } from '../pages/onboarding/feature-education/feature-education';
import { PaperWalletPage } from '../pages/paper-wallet/paper-wallet';
import { PinModalPage } from '../pages/pin/pin-modal/pin-modal';
import { AmountPage } from '../pages/send/amount/amount';
import { ConfirmPage } from '../pages/send/confirm/confirm';
import { AboutPage } from '../pages/settings/about/about';
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
    | typeof FeatureEducationPage;
  private onResumeSubscription: Subscription;
  private isCopayerModalOpen: boolean;
  private copayerModal: any;

  private pageMap = {
    AboutPage,
    AddressbookAddPage,
    AmountPage,
    ConfirmPage,
    CopayersPage,
    ImportWalletPage,
    JoinWalletPage,
    AddWalletPage,
    PaperWalletPage,
    WalletDetailsPage,
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
    private profileProvider: ProfileProvider,
    private configProvider: ConfigProvider,
    private imageLoaderConfig: ImageLoaderConfig,
    private modalCtrl: ModalController,
    private emailNotificationsProvider: EmailNotificationsProvider,
    private screenOrientation: ScreenOrientation,
    private popupProvider: PopupProvider,
    private pushNotificationsProvider: PushNotificationsProvider,
    private incomingDataProvider: IncomingDataProvider,
    private renderer: Renderer2,
    private userAgent: UserAgent,
    private device: Device,
    private keyProvider: KeyProvider,
    private persistenceProvider: PersistenceProvider,
    private iab: InAppBrowserProvider,
    private themeProvider: ThemeProvider,
    private logsProvider: LogsProvider,
    private dynamicLinksProvider: DynamicLinksProvider,
    private addressBookProvider: AddressBookProvider,
    private analyticsProvider: AnalyticsProvider
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
        this.popupProvider.ionicAlert(title, message).then(() => {
          // Share logs
          const platform = this.platformProvider.isCordova
            ? this.platformProvider.isAndroid
              ? 'android'
              : 'ios'
            : 'desktop';
          this.logsProvider.get(this.appProvider.info.nameCase, platform);
        });
      });
  }

  private async onAppLoad(readySource) {
    const deviceInfo = this.platformProvider.getDeviceInfo();

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

    const network = await this.persistenceProvider.getNetwork();

    if (network) {
      this.NETWORK = network;
    }

    this.logger.debug('BitPay: setting network', this.NETWORK);

    this.logger.debug('Setting Cached Total Balance');
    this.appProvider.setTotalBalance();

    if (this.platform.is('cordova')) {
      this.statusBar.show();

      // Set User-Agent
      this.logger.debug('Setting User Agent');
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

      // Support landscape & portrait
      this.logger.debug('Setting Screen Orientation');
      this.screenOrientation.unlock();

      // Only for iOS
      if (this.platform.is('ios')) {
        this.statusBar.overlaysWebView(true);

        // Check for AppTrackingTransparency
        this.analyticsProvider
          .setTrackingPermissions()
          .then(value => {
            this.logger.info('AppTrackingTransparency: ' + value);
          })
          .catch(err => {
            this.logger.warn('AppTrackingTransparency: ' + err);
          });
      }

      // Subscribe Resume
      this.logger.debug('On Resume Subscription');
      this.onResumeSubscription = this.platform.resume.subscribe(async () => {
        // Check PIN or Fingerprint on Resume
        this.openLockModal();

        // Set Theme (light or dark mode)
        await this.themeProvider.load();
        this.themeProvider.apply();

        // Clear all notifications
        this.pushNotificationsProvider.clearAllNotifications();

        // Firebase Dynamic link
        this.dynamicLinksProvider.init();
      });

      // Check PIN or Fingerprint
      this.logger.debug('Open Lock Modal');
      this.openLockModal();

      // Clear all notifications
      this.pushNotificationsProvider.clearAllNotifications();
      // Firebase Dynamic link
      this.dynamicLinksProvider.init();
    }

    // Set Theme (light or dark mode)
    this.themeProvider.apply();
    if (this.platformProvider.isElectron) this.updateDesktopOnFocus();

    this.incomingDataRedirEvent();
    this.events.subscribe('OpenWallet', (wallet, params) =>
      this.openWallet(wallet, params)
    );

    setTimeout(() => {
      this.logger.debug('Hide Splash Screen');
      this.splashScreen.hide();
    }, 1000);

    this.keyProvider
      .load()
      .then(() => {
        // Check Profile
        this.profileProvider
          .loadAndBindProfile()
          .then(onboardingState => {
            switch (onboardingState) {
              case 'NONAGREEDDISCLAIMER':
                this.logger.warn('Non agreed disclaimer');
                this.rootPage = DisclaimerPage;
                break;
              case 'UNFINISHEDONBOARDING':
                this.logger.warn('Unfinished onboarding');
                this.rootPage =
                  this.appProvider.info.nameCase === 'Copay'
                    ? DisclaimerPage
                    : FeatureEducationPage;
                break;
              default:
                const profile = this.profileProvider.profile;
                this.onProfileLoad(profile);
            }
          })
          .catch(err => {
            this.popupProvider
              .ionicAlert('Could not load the profile', err.message)
              .then(() => {
                // Share logs
                const platform = this.platformProvider.isCordova
                  ? this.platformProvider.isAndroid
                    ? 'android'
                    : 'ios'
                  : 'desktop';
                this.logsProvider.get(this.appProvider.info.nameCase, platform);
              });
          });
      })
      .catch(err => {
        this.logger.error('Error loading keys: ', err);
        this.popupProvider
          .ionicAlert('Error loading keys', err.message || '')
          .then(() => {
            // Share logs
            const platform = this.platformProvider.isCordova
              ? this.platformProvider.isAndroid
                ? 'android'
                : 'ios'
              : 'desktop';
            this.logsProvider.get(this.appProvider.info.nameCase, platform);
          });
      });

    await this.persistenceProvider.setTempMdesCertOnlyFlag('disabled');

    this.addressBookProvider.migrateOldContacts();
  }

  private updateDesktopOnFocus() {
    const { remote } = (window as any).require('electron');
    const win = remote.getCurrentWindow();
    win.on('focus', () => {
      if (this.themeProvider.useSystemTheme) {
        this.themeProvider.getDetectedSystemTheme().then(theme => {
          if (this.themeProvider.currentAppTheme == theme) return;
          this.themeProvider.setActiveTheme('system', theme);
        });
      }
    });
  }

  private onProfileLoad(profile) {
    this.emailNotificationsProvider.init(); // Update email subscription if necessary
    this.initPushNotifications();

    if (this.platform.is('cordova')) {
      this.handleDeepLinks();
    }

    if (this.platformProvider.isElectron) {
      this.handleDeepLinksElectron();
    }

    if (profile) {
      this.logger.info('Profile exists.');
      this.rootPage = TabsPage;
    } else {
      this.logger.info('No profile exists.');
      this.profileProvider.createProfile();
      this.rootPage =
        this.appProvider.info.nameCase === 'Copay'
          ? DisclaimerPage
          : FeatureEducationPage;
    }
  }

  private openLockModal(): void {
    if (this.appProvider.isLockModalOpen) return;
    if (this.appProvider.skipLockModal && this.platformProvider.isAndroid) {
      // workaround for android devices that execute pause for system actions
      this.appProvider.skipLockModal = false;
      return;
    }
    const config = this.configProvider.get();
    const lockMethod =
      config && config.lock && config.lock.method
        ? config.lock.method.toLowerCase()
        : null;

    if (!lockMethod || lockMethod === 'disabled') {
      return;
    }

    if (lockMethod == 'pin') {
      this.openPINModal('checkPin');
    } else if (lockMethod == 'fingerprint') {
      this.openFingerprintModal();
    }
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
    modal.onWillDismiss(() => {
      this.onLockWillDismiss();
    });
    modal.onDidDismiss(() => {
      this.onLockDidDismiss();
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
    modal.onWillDismiss(() => {
      this.onLockWillDismiss();
    });
    modal.onDidDismiss(() => {
      this.onLockDidDismiss();
    });
  }

  private onLockDidDismiss(): void {
    this.appProvider.isLockModalOpen = false;
    this.events.publish('Local/FetchWallets');
    this.events.publish('Local/showNewFeaturesSlides');
  }

  private onLockWillDismiss(): void {
    // this.iabCardProvider.resume();
  }

  private incomingDataRedirEvent(): void {
    this.events.subscribe('IncomingDataRedir', nextView => {
      if (!nextView.name) {
        if (nextView.params && nextView.params.fromFooterMenu) return;
        setTimeout(() => {
          this.getGlobalTabs()
            .goToRoot()
            .then(_ => {
              this.getGlobalTabs().select(2);
            });
        }, 300);
      } else if (nextView.name === 'CardsPage') {
        this.getGlobalTabs()
          .goToRoot()
          .then(_ => {
            this.getGlobalTabs().select(4);
          });
      } else if (nextView.name === 'WalletConnectPage') {
        const currentIndex = this.nav.getActive().index;
        const currentView = this.nav.getViews();
        const views = this.nav.getActiveChildNavs()[0].getSelected()._views;
        if (
          (views[views.length - 1].name !== 'WalletConnectPage' &&
            currentView[currentIndex].name !== 'WalletConnectPage') ||
          nextView.params.uri.indexOf('bridge') !== -1
        ) {
          this.getGlobalTabs()
            .goToRoot()
            .then(_ => {
              this.getGlobalTabs().select(5);
              this.nav.push(this.pageMap[nextView.name], nextView.params);
            });
        }
        return;
      } else {
        if (nextView.params && nextView.params.deepLink) {
          // No params -> return
          if (nextView.name == 'DynamicLink') return;
          // From deepLink
          setTimeout(() => {
            this.getGlobalTabs()
              .goToRoot()
              .then(_ => {
                this.getGlobalTabs().select(0);
                this.nav.push(this.pageMap[nextView.name]);
              });
          }, 1000);
          return;
        }
        this.closeScannerFromWithinWallet();
        // wait for wallets status
        setTimeout(() => {
          const globalNav = this.getGlobalTabs().getSelected();
          globalNav
            .push(this.pageMap[nextView.name], nextView.params)
            .then(() => {
              if (typeof nextView.callback === 'function') {
                nextView.callback();
              }
            });
        }, 300);
      }
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
    visible
      ? this.renderer.addClass(walletDetailsModal, 'scanning')
      : this.renderer.removeClass(walletDetailsModal, 'scanning');
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
    if (url.includes('wallet-card/order-now')) {
      const context = url.includes('new') ? 'new' : 'fv';
      this.persistenceProvider.setCardFastTrackEnabled(context);
    }
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
    } else if (pathData.indexOf('ethereum:/') != -1) {
      this.logger.debug('Ethereum URL found');
      this.handleOpenUrl(pathData.substring(pathData.indexOf('ethereum:/')));
    } else if (pathData.indexOf('ripple:/') != -1) {
      this.logger.debug('Ripple URL found');
      this.handleOpenUrl(pathData.substring(pathData.indexOf('ripple:/')));
    } else if (pathData.indexOf('dogecoin:/') != -1) {
      this.logger.debug('Dogecoin URL found');
      this.handleOpenUrl(pathData.substring(pathData.indexOf('dogecoin:/')));
    } else if (pathData.indexOf('litecoin:/') != -1) {
      this.logger.debug('Litecoin URL found');
      this.handleOpenUrl(pathData.substring(pathData.indexOf('litecoin:/')));
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
