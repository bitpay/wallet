import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController } from 'ionic-angular';

// pages
import { SendFeedbackPage } from '../../feedback/send-feedback/send-feedback';
import { SessionLogPage } from './session-log/session-log';

// providers
import {
  AppProvider,
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
  public versionItemTapped: number;

  constructor(
    private navCtrl: NavController,
    private appProvider: AppProvider,
    private logger: Logger,
    private externalLinkProvider: ExternalLinkProvider,
    private replaceParametersProvider: ReplaceParametersProvider,
    private translate: TranslateService,
    private persistenceProvider: PersistenceProvider
  ) {
    this.versionItemTapped = 0;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: AboutPage');
    this.commitHash = this.appProvider.info.commitHash;
    this.version = this.appProvider.info.version;
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

  public itemTapped() {
    this.versionItemTapped++;
    if (this.versionItemTapped >= 5) {
      this.versionItemTapped = 0;
      this.persistenceProvider.getHiddenFeaturesFlag().then(res => {
        res === 'enabled'
          ? this.persistenceProvider.removeHiddenFeaturesFlag()
          : this.persistenceProvider.setHiddenFeaturesFlag('enabled');
        this.navCtrl.popToRoot();
      });
    }
  }
}
