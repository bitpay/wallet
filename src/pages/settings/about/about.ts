import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';

//pages
import { SessionLogPage } from './session-log/session-log';
import { TermsOfUsePage } from './terms-of-use/terms-of-use';

//providers
import { AppProvider } from '../../../providers/app/app';
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';

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
    private app: AppProvider,
    private logger: Logger,
    private externalLinkProvider: ExternalLinkProvider,
    private translate: TranslateService
  ) { }

  public ionViewDidLoad() {
    this.logger.debug('ionViewDidLoad AboutPage');
    this.commitHash = this.app.info.commitHash;
    this.version = this.app.info.version;
    this.title = 'About' + ' ' + this.app.info.nameCase;
  }

  public openTermsOfUse(): void {
    this.navCtrl.push(TermsOfUsePage);
  }

  public openExternalLink(): void {
    const url = 'https://github.com/bitpay/' + this.app.info.gitHubRepoName + '/tree/' + this.app.info.commitHash + '';
    const optIn = true;
    const title = this.translate.instant('Open GitHub Project');
    const message = this.translate.instant('You can see the latest developments and contribute to this open source app by visiting our project on GitHub.');
    const okText = this.translate.instant('Open GitHub');
    const cancelText = this.translate.instant('Go Back');
    this.externalLinkProvider.open(url, optIn, title, message, okText, cancelText);
  }

  public openSessionLog(): void {
    this.navCtrl.push(SessionLogPage);
  }


}
