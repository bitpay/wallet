import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events, NavController } from 'ionic-angular';

// pages
import { SendFeedbackPage } from '../../feedback/send-feedback/send-feedback';
import { SessionLogPage } from './session-log/session-log';

// providers
import {
  AppProvider,
  BitPayProvider,
  ConfigProvider,
  ExternalLinkProvider,
  Logger,
  PersistenceProvider,
  ReplaceParametersProvider,
  ThemeProvider
} from '../../../providers';

@Component({
  selector: 'page-about',
  templateUrl: 'about.html'
})
export class AboutPage {
  public version: string;
  public commitHash: string;
  public title: string;
  private tapped = 0;
  private headerTaps = 0;
  private releaseInfoTaps = 0;
  public pressed: number = 0;
  constructor(
    private navCtrl: NavController,
    private appProvider: AppProvider,
    private logger: Logger,
    private externalLinkProvider: ExternalLinkProvider,
    private replaceParametersProvider: ReplaceParametersProvider,
    private translate: TranslateService,
    private bitpayProvider: BitPayProvider,
    private persistenceProvider: PersistenceProvider,
    private configProvider: ConfigProvider,
    private themeProvider: ThemeProvider,
    private events: Events
  ) {}

  ionViewDidLoad() {
    this.logger.info('Loaded: AboutPage');
    this.commitHash = this.appProvider.info.commitHash;
    this.version = this.appProvider.info.version;
    this.headerTaps = 0;
    this.releaseInfoTaps = 0;
    this.title = this.replaceParametersProvider.replace(
      this.translate.instant('About {{appName}}'),
      { appName: this.appProvider.info.nameCase }
    );
  }

  public openExternalLink(): void {
    const url =
      'https://github.com/bitpay/' +
      this.appProvider.info.gitHubRepoName +
      '/tree/' +
      this.appProvider.info.commitHash +
      '';
    const optIn = true;
    const title = this.translate.instant('Open GitHub Project');
    const message = this.translate.instant(
      'You can see the latest developments and contribute to this open source app by visiting our project on GitHub.'
    );
    const okText = this.translate.instant('Open GitHub');
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
    const url = 'https://bitpay.com/about/terms#wallet';
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

  public countReleaseInfoTaps() {
    let easterEggStatus = this.persistenceProvider.getTestingAdvertisments();
    this.releaseInfoTaps++;
    if (easterEggStatus && this.releaseInfoTaps == 10) {
      console.log('Testing ads disabled');
      this.persistenceProvider.setTestingAdvertisements(false);
      this.events.publish('Local/TestAdsToggle', false);
    }
  }

  public countAboutHeaderTaps() {
    this.headerTaps++;
    let easterEggStatus = this.persistenceProvider.getTestingAdvertisments();
    if (easterEggStatus && this.headerTaps == 12) {
      console.log('Testing ads enabled');
      this.persistenceProvider.setTestingAdvertisements(true);
      this.events.publish('Local/TestAdsToggle', true);
    }
  }

  public openPrivacyPolicy() {
    const url = 'https://bitpay.com/about/privacy';
    const optIn = true;
    const title = null;
    const message = this.translate.instant('View Privacy Policy');
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

  public openSessionLog(): void {
    this.navCtrl.push(SessionLogPage);
  }

  public openSendFeedbackPage(): void {
    this.navCtrl.push(SendFeedbackPage);
  }

  // adding this for testing purposes
  public async wipeBitPayAccounts() {
    this.tapped++;
    if (this.tapped >= 10) {
      await this.persistenceProvider.removeAllBitPayAccounts(
        this.bitpayProvider.getEnvironment().network
      );
      alert('removed accounts');
      this.tapped = 0;
    }
  }

  public async easterEgg() {
    const config = this.configProvider.get();
    if (config.theme.enabled) return;
    this.pressed++;
    if (this.pressed == 5) {
      this.themeProvider.getDetectedSystemTheme().then(detectedTheme => {
        this.themeProvider.setActiveTheme('system', detectedTheme);
        this.pressed = 0;
      });
    }
  }
}
