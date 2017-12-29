import { Component } from '@angular/core';
import { NavParams, NavController } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';

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
    private externalLinkProvider: ExternalLinkProvider
  ) {
    this.score = this.navParams.data.score;
    this.appName = this.appProvider.info.nameCase;
    this.isAndroid = this.platformProvider.isAndroid;
    this.isIOS = this.platformProvider.isIOS;
    this.config = this.configProvider.get();
  }


  public skip(): void {
    let dataSrc = {
      "Email": _.values(this.config.emailFor)[0] || ' ',
      "Feedback": ' ',
      "Score": this.score,
      "AppVersion": this.appProvider.info.version,
      "Platform": 'platform', //TODO ionic.Platform.platform()
      "DeviceVersion": 'version' //TODO ionic.Platform.version()
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
