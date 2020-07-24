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
  ExternalLinkProvider,
  Logger,
  PersistenceProvider,
  ReplaceParametersProvider
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
  private releaseInfoTaps = 0;
  private easterEggStatus;
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
    private events: Events
  ) {}

  async ionViewDidLoad() {
    this.logger.info('Loaded: AboutPage');
    this.commitHash = this.appProvider.info.commitHash;
    this.version = this.appProvider.info.version;
    this.releaseInfoTaps = 0;
    this.title = this.replaceParametersProvider.replace(
      this.translate.instant('About {{appName}}'),
      { appName: this.appProvider.info.nameCase }
    );
    this.easterEggStatus = await this.persistenceProvider.getTestingAdvertisments();
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

  public async countReleaseHeaderTaps() {
    this.releaseInfoTaps++;
    if (this.releaseInfoTaps !== 12) return;
    this.releaseInfoTaps = 0;
    if (this.easterEggStatus === 'enabled') {
      this.easterEggStatus = undefined;
      this.persistenceProvider.removeTestingAdvertisments();
      this.events.publish('Local/TestAdsToggle', false);
    } else {
      this.easterEggStatus = 'enabled';
      this.persistenceProvider.setTestingAdvertisements('enabled');
      this.events.publish('Local/TestAdsToggle', true);
    }
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
}
