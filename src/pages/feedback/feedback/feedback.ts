import { Component } from '@angular/core';
import { NavParams, NavController, Platform } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';

//providers
import { PlatformProvider } from '../../../providers/platform/platform';
import { AppProvider } from '../../../providers/app/app';
import { ConfigProvider } from '../../../providers/config/config';
import { FeedbackProvider } from '../../../providers/feedback/feedback';
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';

//pages
import { FeedbackCompletePage } from '../feedback-complete/feedback-complete';
import { SendFeedbackPage } from '../send-feedback/send-feedback';

import * as _ from 'lodash';

@Component({
  selector: 'page-feedback',
  templateUrl: 'feedback.html',
})
export class FeedbackPage {

  public score: number;
  public appName: string;

  private isAndroid: boolean;
  private isIOS: boolean;
  private config: any;

  constructor(
    private platformProvider: PlatformProvider,
    private appProvider: AppProvider,
    private configProvider: ConfigProvider,
    private navParams: NavParams,
    private feedbackProvider: FeedbackProvider,
    private navCtrl: NavController,
    private logger: Logger,
    private externalLinkProvider: ExternalLinkProvider,
    private platform: Platform
  ) {
    this.score = this.navParams.data.score;
    this.appName = this.appProvider.info.nameCase;
    this.isAndroid = this.platformProvider.isAndroid;
    this.isIOS = this.platformProvider.isIOS;
    this.config = this.configProvider.get();
  }


  public skip(): void {
    let platform = this.platform.platforms().join("");
    let versions: any = this.platform.versions();
    versions = _.values(_.pickBy(versions, _.identity)) //remove undefined and get array of versions
    let version: any = versions && versions[0] ? versions[0] : null;
    let versionStr = version ? version.str : '';

    let dataSrc = {
      "Email": _.values(this.config.emailFor)[0] || ' ',
      "Feedback": ' ',
      "Score": this.score,
      "AppVersion": this.appProvider.info.version,
      "Platform": platform,
      "DeviceVersion": versionStr
    };
    this.feedbackProvider.send(dataSrc).then(() => {
      this.navCtrl.push(FeedbackCompletePage, { score: this.score, skipped: true })
    }).catch(() => {
      this.logger.warn('Could not send feedback.');
      this.navCtrl.push(FeedbackCompletePage, { score: this.score, skipped: true })
    });
  };

  public sendFeedback(): void {
    this.navCtrl.push(SendFeedbackPage, { score: this.score })
  }

  public goAppStore(): void {
    let defaults = this.configProvider.getDefaults();
    let url;
    if (this.isAndroid)
      url = this.appName == 'Copay' ? defaults.rateApp.copay.android : defaults.rateApp.bitpay.android;
    if (this.isIOS)
      url = this.appName == 'Copay' ? defaults.rateApp.copay.ios : defaults.rateApp.bitpay.ios;

    this.externalLinkProvider.open(url);
    this.navCtrl.push(FeedbackCompletePage, { score: this.score, skipped: true, rated: true })
  }

}
