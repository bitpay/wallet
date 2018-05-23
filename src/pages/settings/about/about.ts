import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';

// pages
import { SessionLogPage } from './session-log/session-log';

// providers
import { AppProvider } from '../../../providers/app/app';
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';
import { ReplaceParametersProvider } from '../../../providers/replace-parameters/replace-parameters';

@Component({
  selector: 'page-about',
  templateUrl: 'about.html',
})
export class AboutPage {
  public version: string;
  public commitHash: string;
  public title: string;

  constructor(
    private navCtrl: NavController,
    private appProvider: AppProvider,
    private logger: Logger,
    private externalLinkProvider: ExternalLinkProvider,
    private replaceParametersProvider: ReplaceParametersProvider,
    private translate: TranslateService
  ) { }

  ionViewDidLoad() {
    this.logger.debug('ionViewDidLoad AboutPage');
    this.commitHash = this.appProvider.info.commitHash;
    this.version = this.appProvider.info.version;
    this.title = this.replaceParametersProvider.replace(this.translate.instant("About {{appName}}"), { appName: this.appProvider.info.nameCase });
  }

  public openExternalLink(): void {
    let url = 'https://github.com/bitpay/' + this.appProvider.info.gitHubRepoName + '/tree/' + this.appProvider.info.commitHash + '';
    let optIn = true;
    let title = this.translate.instant('Open GitHub Project');
    let message = this.translate.instant('You can see the latest developments and contribute to this open source app by visiting our project on GitHub.');
    let okText = this.translate.instant('Open GitHub');
    let cancelText = this.translate.instant('Go Back');
    this.externalLinkProvider.open(url, optIn, title, message, okText, cancelText);
  }

  public openTermsOfUse() {
    let url = 'https://bitpay.com/about/terms#wallet';
    let optIn = true;
    let title = null;
    let message = this.translate.instant('View Wallet Terms of Use');
    let okText = this.translate.instant('Open');
    let cancelText = this.translate.instant('Go Back');
    this.externalLinkProvider.open(url, optIn, title, message, okText, cancelText);
  }

  public openPrivacyPolicy() {
    let url = 'https://bitpay.com/about/privacy';
    let optIn = true;
    let title = null;
    let message = this.translate.instant('View Privacy Policy');
    let okText = this.translate.instant('Open');
    let cancelText = this.translate.instant('Go Back');
    this.externalLinkProvider.open(url, optIn, title, message, okText, cancelText);
  }

  public openSessionLog(): void {
    this.navCtrl.push(SessionLogPage);
  }


}
