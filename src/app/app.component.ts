import { Component, Renderer, ViewChild } from '@angular/core';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import {
  App,
  Events,
  ModalController,
  NavController,
  Platform
} from 'ionic-angular';
import { Observable, Subscription } from 'rxjs';

// providers
import { AmazonProvider } from '../providers/amazon/amazon';
import { AppProvider } from '../providers/app/app';
import { BitPayCardProvider } from '../providers/bitpay-card/bitpay-card';
import { CoinbaseProvider } from '../providers/coinbase/coinbase';
import { ConfigProvider } from '../providers/config/config';
import { DomProvider } from '../providers/dom/dom';
import { EmailNotificationsProvider } from '../providers/email-notifications/email-notifications';
import { GlideraProvider } from '../providers/glidera/glidera';
import { IncomingDataProvider } from '../providers/incoming-data/incoming-data';
import { Logger } from '../providers/logger/logger';
import { MercadoLibreProvider } from '../providers/mercado-libre/mercado-libre';
import { PopupProvider } from '../providers/popup/popup';
import { ProfileProvider } from '../providers/profile/profile';
import { PushNotificationsProvider } from '../providers/push-notifications/push-notifications';
import { ShapeshiftProvider } from '../providers/shapeshift/shapeshift';
import { TouchIdProvider } from '../providers/touchid/touchid';

// pages
import { CopayersPage } from '../pages/add/copayers/copayers';
import { ImportWalletPage } from '../pages/add/import-wallet/import-wallet';
import { JoinWalletPage } from '../pages/add/join-wallet/join-wallet';
import { FingerprintModalPage } from '../pages/fingerprint/fingerprint';
import { WalletSelectorPage } from '../pages/includes/wallet-selector/wallet-selector';
import { BitPayCardIntroPage } from '../pages/integrations/bitpay-card/bitpay-card-intro/bitpay-card-intro';
import { CoinbasePage } from '../pages/integrations/coinbase/coinbase';
import { GlideraPage } from '../pages/integrations/glidera/glidera';
import { DisclaimerPage } from '../pages/onboarding/disclaimer/disclaimer';
import { OnboardingPage } from '../pages/onboarding/onboarding';
import { PaperWalletPage } from '../pages/paper-wallet/paper-wallet';
import { PinModalPage } from '../pages/pin/pin-modal/pin-modal';
import { AmountPage } from '../pages/send/amount/amount';
import { ConfirmPage } from '../pages/send/confirm/confirm';
import { AddressbookAddPage } from '../pages/settings/addressbook/add/add';
import { TabsPage } from '../pages/tabs/tabs';
import { WalletDetailsPage } from '../pages/wallet-details/wallet-details';
import { WalletTabsProvider } from '../pages/wallet-tabs/wallet-tabs.provider';

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
  @ViewChild('appNav') nav: NavController;

  public rootPage:
    | typeof AmountPage
    | typeof DisclaimerPage
    | typeof TabsPage
    | typeof OnboardingPage;
  private onResumeSubscription: Subscription;
  private isModalOpen: boolean;

  private pageMap = {
    AddressbookAddPage,
    AmountPage,
    BitPayCardIntroPage,
    CoinbasePage,
    ConfirmPage,
    CopayersPage,
    GlideraPage,
    ImportWalletPage,
    JoinWalletPage,
    PaperWalletPage,
    WalletDetailsPage
  };

  constructor(
    private domProvider: DomProvider,
    private platform: Platform,
    private statusBar: StatusBar,
    private splashScreen: SplashScreen,
    private events: Events,
    private logger: Logger,
    private appProvider: AppProvider,
    private profile: ProfileProvider,
    private configProvider: ConfigProvider,
    private modalCtrl: ModalController,
    private glideraProvider: GlideraProvider,
    private coinbaseProvider: CoinbaseProvider,
    private amazonProvider: AmazonProvider,
    private bitPayCardProvider: BitPayCardProvider,
    private mercadoLibreProvider: MercadoLibreProvider,
    private shapeshiftProvider: ShapeshiftProvider,
    private emailNotificationsProvider: EmailNotificationsProvider,
    private screenOrientation: ScreenOrientation,
    private popupProvider: PopupProvider,
    private pushNotificationsProvider: PushNotificationsProvider,
    private app: App,
    private incomingDataProvider: IncomingDataProvider,
    private walletTabsProvider: WalletTabsProvider,
    private renderer: Renderer
  ) {
    this.initializeApp();
  }

  ngOnDestroy() {
    this.onResumeSubscription.unsubscribe();
  }

  initializeApp() {
    this.platform
      .ready()
      .then(readySource => {
        this.onPlatformReady(readySource);
        this.domProvider.appendComponentToBody<WalletSelectorPage>(
          WalletSelectorPage as any
        );
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
        let title = 'Could not initialize the app';
        let message = JSON.stringify(err);
        this.popupProvider.ionicAlert(title, message);
      });
  }

  private onAppLoad(readySource) {
    this.logger.info(
      'Platform ready (' +
        readySource +
        '): ' +
        this.appProvider.info.nameCase +
        ' - v' +
        this.appProvider.info.version +
        ' #' +
        this.appProvider.info.commitHash
    );

    if (this.platform.is('cordova')) {
      this.statusBar.show();

      // Set to portrait
      this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT);

      // Only overlay for iOS
      if (this.platform.is('ios')) this.statusBar.overlaysWebView(true);

      this.statusBar.styleLightContent();
      this.splashScreen.hide();

      // Subscribe Resume
      this.onResumeSubscription = this.platform.resume.subscribe(() => {
        // Check PIN or Fingerprint on Resume
        this.openLockModal();
      });

      // Check PIN or Fingerprint
      this.openLockModal();
    }

    this.registerIntegrations();
    this.incomingDataRedirEvent();
    this.scanFromWalletEvent();
    // Check Profile
    this.profile
      .loadAndBindProfile()
      .then(profile => {
        this.onProfileLoad(profile);
      })
      .catch((err: Error) => {
        this.logger.warn('LoadAndBindProfile', err.message);
        this.rootPage =
          err.message == 'ONBOARDINGNONCOMPLETED: Onboarding non completed'
            ? OnboardingPage
            : DisclaimerPage;
      });
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

      if (this.isNodeWebkit()) {
        this.handleDeepLinksNW();
      }
    } else {
      this.logger.info('No profile exists.');
      this.profile.createProfile();
      this.rootPage = OnboardingPage;
    }
  }

  private openLockModal(): void {
    if (this.isModalOpen) return;
    let config = this.configProvider.get();
    let lockMethod =
      config && config.lock && config.lock.method
        ? config.lock.method.toLowerCase()
        : null;
    if (!lockMethod) return;
    if (lockMethod == 'pin') this.openPINModal('checkPin');
    if (lockMethod == 'fingerprint') this.openFingerprintModal();
  }

  private openPINModal(action): void {
    this.isModalOpen = true;
    const modal = this.modalCtrl.create(
      PinModalPage,
      { action },
      { cssClass: 'fullscreen-modal' }
    );
    modal.present({ animate: false });
    modal.onDidDismiss(() => {
      this.isModalOpen = false;
    });
  }

  private openFingerprintModal(): void {
    this.isModalOpen = true;
    const modal = this.modalCtrl.create(
      FingerprintModalPage,
      {},
      { cssClass: 'fullscreen-modal' }
    );
    modal.present({ animate: false });
    modal.onDidDismiss(() => {
      this.isModalOpen = false;
    });
  }

  private registerIntegrations(): void {
    // Mercado Libre
    if (this.appProvider.info._enabledExtensions.mercadolibre)
      this.mercadoLibreProvider.register();

    // Amazon Gift Cards
    if (this.appProvider.info._enabledExtensions.amazon)
      this.amazonProvider.register();

    // ShapeShift
    if (this.appProvider.info._enabledExtensions.shapeshift)
      this.shapeshiftProvider.register();

    // Glidera
    if (this.appProvider.info._enabledExtensions.glidera) {
      this.glideraProvider.setCredentials();
      this.glideraProvider.register();
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
      this.getSelectedTabNav().push(
        this.pageMap[nextView.name],
        nextView.params
      );
    });
  }

  private scanFromWalletEvent(): void {
    this.events.subscribe('ScanFromWallet', async () => {
      await this.getGlobalTabs().select(1);
      await this.toggleScannerVisibilityFromWithinWallet(true, 300);
    });
    this.events.subscribe('ExitScan', async () => {
      this.closeScannerFromWithinWallet();
    });
  }

  private async closeScannerFromWithinWallet() {
    if (!this.getWalletDetailsModal()) {
      return;
    }
    await this.toggleScannerVisibilityFromWithinWallet(false, 300);
    await this.getGlobalTabs().select(0);
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
    this.events.subscribe('OpenWalletEvent', nextView => {
      this.app.getRootNavs()[0].setRoot(TabsPage);
      this.nav.push(this.pageMap[nextView.name], nextView.params);
    });
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
      setTimeout(() => {
        this.logger.info('App was opened by custom url scheme');
        this.handleOpenUrl(lastUrl);
      }, 0);
    }
  }

  private handleOpenUrl(url: string) {
    if (!this.incomingDataProvider.redir(url)) {
      this.logger.warn('Unknown URL! : ' + url);
    }
  }

  private handleDeepLinksNW() {
    var gui = (window as any).require('nw.gui');

    // This event is sent to an existent instance of Copay (only for standalone apps)
    gui.App.on('open', this.onOpenNW.bind(this));

    // Used at the startup of Copay
    var argv = gui.App.argv;
    if (argv && argv[0] && !(window as any)._urlHandled) {
      (window as any)._urlHandled = true;
      this.handleOpenUrl(argv[0]);
    }
  }

  private onOpenNW(pathData) {
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

  private isNodeWebkit(): boolean {
    let isNode =
      typeof process !== 'undefined' && typeof require !== 'undefined';
    if (isNode) {
      try {
        return typeof (window as any).require('nw.gui') !== 'undefined';
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  private getSelectedTabNav() {
    const globalNav = this.getGlobalTabs().getSelected();
    const walletTabs = this.walletTabsProvider.getTabNav();
    return (walletTabs && walletTabs.getSelected()) || globalNav;
  }

  private getGlobalTabs() {
    return this.nav.getActiveChildNavs()[0].viewCtrl.instance.tabs;
  }
}
