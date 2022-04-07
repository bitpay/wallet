import { Component, ElementRef, Renderer2, ViewChild } from '@angular/core';
import { Config, ModalController, NavController, Platform } from '@ionic/angular';
import { Subscription, timer } from 'rxjs';
import { AppProvider } from './providers/app/app';
import { Logger } from './providers/logger/logger';
import { LogsProvider } from './providers/logs/logs';
import { PersistenceProvider } from './providers/persistence/persistence';
import { PlatformProvider } from './providers/platform/platform';
import { PopupProvider } from './providers/popup/popup';
import { ThemeProvider } from './providers/theme/theme';
import { TouchIdProvider } from './providers/touchid/touchid';
import { SplashScreen } from '@capacitor/splash-screen';
import { EventManagerService } from './providers/event-manager.service';
import { KeyProvider } from './providers/key/key';
import { ProfileProvider } from './providers/profile/profile';
import { PushNotificationsProvider } from './providers/push-notifications/push-notifications';
import { EmailNotificationsProvider } from './providers/email-notifications/email-notifications';
import { IncomingDataProvider } from './providers/incoming-data/incoming-data';
import { ConfigProvider } from './providers/config/config';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { UserAgent } from '@ionic-native/user-agent/ngx';
import { Device } from '@ionic-native/device/ngx';
import { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';
import { DynamicLinksProvider } from './providers/dynamic-links/dynamic-links';
import { AnalyticsProvider } from './providers/analytics/analytics';
import { InAppBrowserProvider } from './providers/in-app-browser/in-app-browser';
import { AddressBookProvider } from './providers/address-book/address-book';
import { Router } from '@angular/router';
import { PinModalPage } from './pages/pin/pin-modal/pin-modal';
import { FingerprintModalPage } from './pages/fingerprint/fingerprint';
import { ImageLoaderConfigService } from 'ionic-image-loader-v5';
import { CopayersPage } from './pages/add/copayers/copayers';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  providers: [TouchIdProvider]
})
export class CopayApp {
  @ViewChild('splash', { static: false }) splash: ElementRef;
  routerHidden;
  nav: NavController;
  cardIAB_Ref: InAppBrowser;
  NETWORK = 'livenet';

  private pageMap = {
    AboutPage: '/tabs/about',
    AddressbookAddPage: '/address-book-add',
    AmountPage: '/amount',
    ConfirmPage: '/confirm',
    CopayersPage: '/copayers',
    ImportWalletPage: '/import-wallet',
    JoinWalletPage: '/join-wallet',
    AddWalletPage: '/add-wallet',
    PaperWalletPage: '/paper-wallet',
    WalletDetailsPage: '/wallet-details'
  };


  private onResumeSubscription: Subscription;
  private isCopayerModalOpen: boolean;
  private copayerModal: any;
  constructor(
    private config: Config,
    private platform: Platform,
    public platformProvider: PlatformProvider,
    private logger: Logger,
    private appProvider: AppProvider,
    private popupProvider: PopupProvider,
    private logsProvider: LogsProvider,
    private persistenceProvider: PersistenceProvider,
    private themeProvider: ThemeProvider,
    private events: EventManagerService,
    private modalCtrl: ModalController,
    private keyProvider: KeyProvider,
    private profileProvider: ProfileProvider,
    private pushNotificationsProvider: PushNotificationsProvider,
    private emailNotificationsProvider: EmailNotificationsProvider,
    private incomingDataProvider: IncomingDataProvider,
    private configProvider: ConfigProvider,
    private statusBar: StatusBar,
    private userAgent: UserAgent,
    private device: Device,
    private screenOrientation: ScreenOrientation,
    private dynamicLinksProvider: DynamicLinksProvider,
    private analyticsProvider: AnalyticsProvider,
    private iab: InAppBrowserProvider,
    private renderer: Renderer2,
    private addressBookProvider: AddressBookProvider,
    private router: Router,
    private imageLoaderConfig: ImageLoaderConfigService,
    private navasd: NavController
  ) {
    this.imageLoaderConfig.setFileNameCachedWithExtension(true);
    this.imageLoaderConfig.useImageTag(true);
    this.imageLoaderConfig.enableSpinner(false);
    this.initializeApp();
    this.platformProvider.isCordova ? this.routerHidden = true : this.routerHidden = false;
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
    this.platform
      .ready()
      .then(async readySource => {
       
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

      await SplashScreen.hide();

      if (this.platformProvider.isCordova) {
        this.platform.ready().then(() => {
          setTimeout(() => {
            this.routerHidden = false;
            this.splash.nativeElement.style.display = 'none';
            // Check PIN or Fingerprint
            this.logger.debug('Open Lock Modal');
            this.openLockModal();
          }, this.platformProvider.isAndroid ? 2700 : 2900);
        })
      }

      // Clear all notifications
      this.pushNotificationsProvider.clearAllNotifications();

      // Firebase Dynamic link
      this.dynamicLinksProvider.init();
    }

    this.themeProvider.apply();
    if (this.platformProvider.isElectron) this.updateDesktopOnFocus();

    this.incomingDataRedirEvent();
    this.events.subscribe('OpenWallet', (wallet, params) =>
      this.openWallet(wallet, params)
    );

    this.keyProvider
      .load()
      .then(() => {
        // Check Profile
        this.profileProvider
          .loadAndBindProfile()
          .then(onboardingState => {
            switch (onboardingState) {
              case 'UNFINISHEDONBOARDING':
                this.logger.warn('Unfinished onboarding');
                const path = '/feature-education';
                this.navasd.navigateRoot([path], {
                  replaceUrl: true
                });
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
    this.setNavigationDefault();
  }

  private setNavigationDefault() {
    this.themeProvider.setActiveNavigationType('scan');
  }

  private async openWallet(wallet, params) {
    if (wallet.isComplete()) {
      this.router.navigate(['/tabs/wallets']).then(() => {
        this.router.navigate(['/wallet-details'], {
          state: {
            ...params,
            walletId: wallet.credentials.walletId
          }
        });
      })
    } else {
      // check if modal is already open
      if (this.isCopayerModalOpen) {
        this.copayerModal.dismiss();
      }
      this.isCopayerModalOpen = true;
      this.copayerModal = await this.modalCtrl.create({
        component: CopayersPage,
        componentProps: {
          ...params,
          walletId: wallet.credentials.walletId
        },
        cssClass: 'wallet-details-modal'

      });
      await this.copayerModal.present();
      this.copayerModal.onDidDismiss().then(({ data }) => {
        this.isCopayerModalOpen = false;
      });
    }
  }

  private incomingDataRedirEvent(): void {
    this.events.subscribe('IncomingDataRedir', nextView => {
      if (!nextView.name) {
        if (nextView.params && nextView.params.fromFooterMenu) return;
        setTimeout(() => {
          this.router.navigate(['/tabs/scan']);
        }, 300);
      } else if (nextView.name === 'CardsPage') {
        setTimeout(() => {
          this.router.navigate(['/tabs/address-book']);
        }, 300);
      } else if (nextView.name === 'WalletConnectPage') {
        // const currentIndex = this.nav.getActive().index;
        // const currentView = this.nav.getViews();
        // const views = this.nav.getActiveChildNavs()[0].getSelected()._views;
        if (
          // (views[views.length - 1].name !== 'WalletConnectPage' &&
          //   currentView[currentIndex].name !== 'WalletConnectPage') ||
          nextView.params.uri.indexOf('bridge') !== -1
        ) {
          this.router.navigate(['/tabs/setting']).then(() => {
            this.router.navigate([this.pageMap[nextView.name]], { state: nextView.params });
          });
        }
        return;
      } else {
        if (nextView.params && nextView.params.deepLink) {
          // No params -> return
          if (nextView.name == 'DynamicLink') return;
          // From deepLink
          setTimeout(() => {
            this.router.navigate(['/tabs/home']).then(() => {
              this.router.navigate([this.pageMap[nextView.name]]);
            });
          }, 1000);
          return;
        }
        this.closeScannerFromWithinWallet();
        // wait for wallets status
        setTimeout(() => {
          this.router.navigate([this.pageMap[nextView.name]], { state: nextView.params }).then(() => {
            if (typeof nextView.callback === 'function') {
              nextView.callback();
            }
          })
        }, 300);
      }
    });
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
    return timer(transitionDuration).toPromise();
  }
  private getWalletDetailsModal(): Element {
    return document.getElementsByClassName('wallet-details-modal')[0];
  }

  private initPushNotifications() {
    this.pushNotificationsProvider.init();
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
      this.router.navigate([''], {
        replaceUrl: true
      });
    } else {
      this.logger.info('No profile exists.');
      this.profileProvider.createProfile();
      const path = '/feature-education';
      this.router.navigate([path], {
        replaceUrl: true
      });
    }
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

  private async openPINModal(action): Promise<void> {
    this.appProvider.isLockModalOpen = true;
    const modal = await this.modalCtrl.create({
      component: PinModalPage,
      componentProps: { action },

      backdropDismiss: false,
      cssClass: 'fullscreen-modal'

    });
    await modal.present();
    modal.onWillDismiss().then(() => {
      this.onLockWillDismiss();
    });
    modal.onDidDismiss().then(() => {
      this.onLockDidDismiss();
    });
  }

  private async openFingerprintModal() {
    this.appProvider.isLockModalOpen = true;
    const modal = await this.modalCtrl.create({
      component: FingerprintModalPage,
      componentProps: {},
      backdropDismiss: false,
      cssClass: 'fullscreen-modal'
    }
    );
    await modal.present();
    modal.onWillDismiss().then(() => {
      this.onLockWillDismiss();
    });
    modal.onDidDismiss().then(() => {
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
}
