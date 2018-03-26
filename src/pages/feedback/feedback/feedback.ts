import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';

// native 
import { Device } from '@ionic-native/device';

// providers
import { AppProvider } from '../../../providers/app/app';
import { ConfigProvider } from '../../../providers/config/config';
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';
import { FeedbackProvider } from '../../../providers/feedback/feedback';
import { PlatformProvider } from '../../../providers/platform/platform';

// pages
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
    private device: Device
  ) {
    this.score = this.navParams.data.score;
    this.appName = this.appProvider.info.nameCase;
    this.isAndroid = this.platformProvider.isAndroid;
    this.isIOS = this.platformProvider.isIOS;
    this.config = this.configProvider.get();
  }


  public skip(): void {

    this.navCtrl.push(FeedbackCompletePage, { score: this.score, skipped: true })

    let platform = this.device.platform;
    let version = this.device.version;

    let dataSrc = {
      "Email": _.values(this.config.emailFor)[0] || ' ',
      "Feedback": ' ',
      "Score": this.score,
      "AppVersion": this.appProvider.info.version,
      "Platform": platform,
      "DeviceVersion": version
    };
    this.feedbackProvider.send(dataSrc).catch(() => {
      this.logger.warn('Could not send feedback.');
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
