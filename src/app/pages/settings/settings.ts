import { ChangeDetectorRef, Component, ViewEncapsulation } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import * as _ from 'lodash';

// providers
import { AnalyticsProvider } from '../../providers/analytics/analytics';
import { AppProvider } from '../../providers/app/app';
import { ConfigProvider } from '../../providers/config/config';
import { ExternalLinkProvider } from '../../providers/external-link/external-link';
import { LanguageProvider } from '../../providers/language/language';
import { Logger } from '../../providers/logger/logger';
import { NewFeatureData } from '../../providers/new-feature-data/new-feature-data';
import {
  PersistenceProvider
} from '../../providers/persistence/persistence';
import { PlatformProvider } from '../../providers/platform/platform';
import { ProfileProvider } from '../../providers/profile/profile';
import { ThemeProvider } from '../../providers/theme/theme';
import { TouchIdProvider } from '../../providers/touchid/touchid';

// pages
import { animate, style, transition, trigger } from '@angular/animations';
import { PinModalPage } from '../pin/pin-modal/pin-modal';
import { ModalController } from '@ionic/angular';
import { EventManagerService } from 'src/app/providers/event-manager.service';
import { Router } from '@angular/router';
import { NewFeaturePage } from '../new-feature/new-feature';
import { ActionSheetProvider } from 'src/app/providers';

@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html',
  animations: [
    trigger('fade', [
      transition(':enter', [
        style({
          transform: 'translateY(5px)',
          opacity: 0
        }),
        animate('200ms')
      ])
    ])
  ],
  styleUrls: ['settings.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SettingsPage {
  public appName: string;
  public currentLanguageName: string;
  public languages;
  public config;
  public selectedAlternative;
  public isCordova: boolean;
  public isCopay: boolean;
  public lockMethod: string;
  public integrationServices = [];
  public cardServices = [];
  public externalServices = [];
  public bitpayCardItems = [];
  public showBitPayCard: boolean = false;
  public encryptEnabled: boolean;
  public touchIdAvailable: boolean;
  public touchIdEnabled: boolean;
  public touchIdPrevValue: boolean;
  public walletsGroups: any[];
  public readOnlyWalletsGroup: any[];
  public bitPayIdUserInfo: any;
  public accountInitials: string;
  public showReorder: boolean = false;
  public showTotalBalance: boolean;
  public appTheme: string;
  public tapped = 0;
  public certOnlyTapped = 0;
  public appVersion: string;
  public navigation: string;
  public featureList: any;
  public isScroll = false;
  useLegacyQrCode;
  constructor(
    private app: AppProvider,
    private actionSheetProvider: ActionSheetProvider,
    private language: LanguageProvider,
    private externalLinkProvider: ExternalLinkProvider,
    public profileProvider: ProfileProvider,
    private configProvider: ConfigProvider,
    private logger: Logger,
    public platformProvider: PlatformProvider,
    private translate: TranslateService,
    private modalCtrl: ModalController,
    private touchid: TouchIdProvider,
    private analyticsProvider: AnalyticsProvider,
    private persistenceProvider: PersistenceProvider,
    private changeRef: ChangeDetectorRef,
    private themeProvider: ThemeProvider,
    private events: EventManagerService,
    private newFeatureData: NewFeatureData,
    private router: Router
  ) {
    this.appName = this.app.info.nameCase;
    this.appVersion = this.app.info.version;
    this.isCordova = this.platformProvider.isCordova;
    this.isCopay = this.app.info.name === 'copay';
  }

  async handleScrolling(event) {
    if (event.detail.currentY > 0) {
      this.isScroll = true;
    }
    else {
      this.isScroll = false;
    }
  }

  ngOnInit() {
    this.logger.info('Loaded: SettingsPage');
    if (this.isCordova) {
      this.events.subscribe('BitPayId/Disconnected', () => this.updateUser());
      this.events.subscribe('BitPayId/Connected', user =>
        this.updateUser(user)
      );

      this.events.subscribe('updateCards', cards => {
        if (cards && cards.length > 0) {
          this.bitpayCardItems = cards;
        }
      });
    }

    this.events.subscribe('Local/UpdateNavigationType', () => {
      // this.navigation = this.themeProvider.getSelectedNavigationType();
      this.navigation = this.themeProvider.getCurrentNavigationType();
    });

    this.events.subscribe('Local/UpdateActiveThem', (opts) => {
      if (opts) this.appTheme = this.themeProvider.getCurrentAppTheme();
    });
  }
  
  toggleQrCodeLegacyFlag(){}

  ngOnDestroy() {
    this.events.unsubscribe('Local/UpdateNavigationType');
    this.events.unsubscribe('Local/UpdateActiveThem');
  }

  async ionViewWillEnter() {
    this.currentLanguageName = this.language.getName(
      this.language.getCurrent()
    );

    const opts = {
      showHidden: true
    };
    const wallets = this.profileProvider.getWallets(opts);
    this.walletsGroups = _.values(
      _.groupBy(
        _.filter(wallets, wallet => {
          return wallet.keyId != 'read-only';
        }),
        'keyId'
      )
    );

    this.readOnlyWalletsGroup = this.profileProvider.getWalletsFromGroup({
      keyId: 'read-only'
    });

    this.config = this.configProvider.get();
    this.selectedAlternative = {
      name: this.config.wallet.settings.alternativeName,
      isoCode: this.config.wallet.settings.alternativeIsoCode
    };
    this.lockMethod =
      this.config && this.config.lock && this.config.lock.method
        ? this.config.lock.method.toLowerCase()
        : null;


    this.showTotalBalance = this.config.totalBalance.show;

    this.featureList = await this.newFeatureData.get();
  }

  ionViewDidEnter() {
    // Get Theme
    this.appTheme = this.themeProvider.getCurrentAppTheme();
    this.navigation = this.themeProvider.getCurrentNavigationType();
  }

  private updateUser(user?) {
    this.bitPayIdUserInfo = user;
    this.accountInitials = this.getBitPayIdInitials(user);
    this.changeRef.detectChanges();
  }

  private getBitPayIdInitials(user): string {
    if (!user) return '';

    const { givenName, familyName } = user;
    return [givenName, familyName]
      .map(name => name && name.charAt(0).toUpperCase())
      .join('');
  }

  public trackBy(index) {
    return index;
  }

  public mdesFlag() {
    // adding this for testing purposes
    this.tapped++;
    if (this.tapped >= 10) {
      this.persistenceProvider.getTempMdesFlag().then(flag => {
        if (flag === 'bypassed') {
          this.persistenceProvider.setTempMdesFlag('disabled');
          alert('MDES bypass -> disabled');
        } else {
          this.persistenceProvider.setTempMdesFlag('bypassed');
          alert('MDES bypass -> bypassed');
        }
        this.tapped = 0;
      });
    }
  }

  public mdesCertOnlyFlag() {
    // adding this for testing purposes
    this.certOnlyTapped++;
    if (this.certOnlyTapped >= 10) {
      this.persistenceProvider.getTempMdesCertOnlyFlag().then(flag => {
        if (flag === 'bypassed') {
          this.persistenceProvider.setTempMdesCertOnlyFlag('disabled');
          alert('MDES cert only bypass -> disabled');
        } else {
          this.persistenceProvider.setTempMdesCertOnlyFlag('bypassed');
          alert('MDES cert only bypass -> bypassed');
        }
        this.certOnlyTapped = 0;
      });
    }
  }

  public openAltCurrencyPage(): void {
    this.router.navigate(['/alt-curency']);
  }

  public openLanguagePage(): void {
    this.router.navigate(['/language']);
  }

  public async openWhatsNew(): Promise<void> {
    if (this.featureList && this.featureList.features.length > 0) {
      const modal = await this.modalCtrl.create({
        component: NewFeaturePage,
        componentProps: {
          featureList: this.featureList
        }
      });
      await modal.present();
      modal.onDidDismiss().then(({ data }) => {
        if (data && data.data && typeof data.data !== 'boolean') {
          this.events.publish('IncomingDataRedir', data.data);
        }
      });
    }
  }

  public openAdvancedPage(): void {
    this.router.navigate(['/advanced']);
  }

  public openAboutPage(): void {
    this.router.navigate(['/about']);
  }

  public openThemePage(): void {
    this.router.navigate(['/local-theme']);
  }

  public openNavigationPage(): void {
    this.router.navigate(['/navigation']);
  }

  public openLockPage(): void {
    const config = this.configProvider.get();
    const lockMethod =
      config && config.lock && config.lock.method
        ? config.lock.method.toLowerCase()
        : null;
    if (!lockMethod || lockMethod == 'disabled') this.router.navigate(['/lock']);
    if (lockMethod == 'pin') this.openPinModal('lockSetUp');
    if (lockMethod == 'fingerprint') this.checkFingerprint();
  }

  public openAddressBookPage(): void {
    this.router.navigate(['/addressbook']);
  }

  public openFeePolicyPage(): void {
    this.router.navigate(['/fee-policy']);
  }

  public openNotificationsPage(): void {
    this.router.navigate(['/notifications']);
  }

  public openWalletSettingsPage(walletId: string): void {
    this.router.navigate(['/wallet-settings']);
  }

  public openSharePage(): void {
    this.router.navigate(['/share']);
  }

  public openHelpExternal(): void {
    this.analyticsProvider.logEvent('help', {});
    const url = 'https://t.me/AbcPay'
    const optIn = true;
    const title = null;
    const message = this.translate.instant(
      'Help and support information is available at the website.'
    );
    const okText = this.translate.instant('Open');
    const cancelText = this.translate.instant('Go Back');
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'help-and-support',
      { secondBtnGroup: true,
        isShowTitle: false
      }
    );
    infoSheet.present();
    infoSheet.onDidDismiss(option => {
      if (!option) return;
      this.externalLinkProvider.open(url);
    });
    
  }

  async openPinModal(action) {
    const modal = await this.modalCtrl.create({
      component: PinModalPage,
      cssClass: 'fullscreen-modal',
      componentProps: {
        action: action
      }
    });
    await modal.present();
    const cancelClicked = await modal.onDidDismiss();
    if (!cancelClicked.data) this.router.navigate(['/lock']);
  }

  private checkFingerprint(): void {
    this.touchid.check().then(() => {
      this.router.navigate(['/lock']);
    });
  }

  public openSupportEncryptPassword(): void {
    const url =
      'https://support.bitpay.com/hc/en-us/articles/360000244506-What-Does-a-Spending-Password-Do-';
    const optIn = true;
    const title = null;
    const message = this.translate.instant('Read more in our support page');
    const okText = this.translate.instant('Open');
    const cancelText = this.translate.instant('Go Back');
    this.externalLinkProvider.open(
      url,
      optIn,
      title,
      message,
      okText,
      cancelText
    );
  }

  public openWalletGroupSettings(keyId: string): void {
    if (this.showReorder) return;
    this.router.navigate(['/key-settings'], {
      state: {
        keyId: keyId
      }
    });
  }

  public goToAddView(): void {
    this.router.navigate(['/add'], {
      state: {
        isZeroState: true
      }
    });
  }

  public toggleShowBalanceFlag(): void {
    let opts = {
      totalBalance: { show: this.showTotalBalance }
    };
    this.configProvider.set(opts);
    if (this.showTotalBalance) this.events.publish('Local/FetchWallets');
  }

  public reorder(): void {
    this.showReorder = !this.showReorder;
  }

  public async reorderAccounts(indexes) {
    const element = this.walletsGroups[indexes.detail.from];
    this.walletsGroups.splice(indexes.detail.from, 1);
    this.walletsGroups.splice(indexes.detail.to, 0, element);
    _.each(this.walletsGroups, (walletGroup, index: number) => {
      this.profileProvider.setWalletGroupOrder(walletGroup[0].keyId, index);
    });
    this.profileProvider.setOrderedWalletsByGroup();
    indexes.detail.complete();
  }

  public openPrivacyPolicy() {
    const url = 'https://bitpay.com/about/privacy';
    const optIn = true;
    const title = null;
    const message = this.translate.instant('View Privacy Notice');
    const okText = this.translate.instant('Open');
    const cancelText = this.translate.instant('Go Back');
    this.externalLinkProvider.open(
      url,
      optIn,
      title,
      message,
      okText,
      cancelText
    );
  }

  public openTermsOfUse() {
    const url = 'https://bitpay.com/legal/terms-of-use/#wallet-terms-of-use';
    const optIn = true;
    const title = null;
    const message = this.translate.instant('View Wallet Terms of Use');
    const okText = this.translate.instant('Open');
    const cancelText = this.translate.instant('Go Back');
    this.externalLinkProvider.open(
      url,
      optIn,
      title,
      message,
      okText,
      cancelText
    );
  }
}
