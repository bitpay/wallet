import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
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
import { ReplaceParametersProvider } from '../../../providers/replace-parameters/replace-parameters';

// pages
import { FeedbackCompletePage } from '../feedback-complete/feedback-complete';
import { SendFeedbackPage } from '../send-feedback/send-feedback';

import * as _ from 'lodash';

@Component({
  selector: 'page-feedback',
  templateUrl: 'feedback.html'
})
export class FeedbackPage {
  public score: number;
  public subtitle: string;
  public subsubtitle: string;

  private isAndroid: boolean;
  private isIOS: boolean;
  private config: any;
  private appName: string;

  constructor(
    private platformProvider: PlatformProvider,
    private appProvider: AppProvider,
    private configProvider: ConfigProvider,
    private navParams: NavParams,
    private feedbackProvider: FeedbackProvider,
    private navCtrl: NavController,
    private logger: Logger,
    private externalLinkProvider: ExternalLinkProvider,
    private device: Device,
    private replaceParametersProvider: ReplaceParametersProvider,
    private translate: TranslateService
  ) {
    this.score = this.navParams.data.score;
    this.isAndroid = this.platformProvider.isAndroid;
    this.isIOS = this.platformProvider.isIOS;
    this.config = this.configProvider.get();
    this.appName = this.appProvider.info.nameCase;
    this.subtitle = this.replaceParametersProvider.replace(
      this.translate.instant(
        '5-star ratings help us get {{appName}} into more hands, and more users means more resources can be committed to the app!'
      ),
      { appName: this.appName }
    );
    this.subsubtitle = this.replaceParametersProvider.replace(
      this.translate.instant(
        'Would you be willing to rate {{appName}} in the app store?'
      ),
      { appName: this.appName }
    );
  }

  public skip(): void {
    this.navCtrl.push(FeedbackCompletePage, {
      score: this.score,
      skipped: true
    });

    let platform = this.device.platform || 'Unknown platform';
    let version = this.device.version || 'Unknown version';

    let dataSrc = {
      email: _.values(this.config.emailFor)[0] || ' ',
      feedback: ' ',
      score: this.score,
      appVersion: this.appProvider.info.version,
      platform,
      deviceVersion: version
    };

    this.feedbackProvider.send(dataSrc).catch(() => {
      this.logger.warn('Could not send feedback.');
    });
  }

  public sendFeedback(): void {
    this.navCtrl.push(SendFeedbackPage, { score: this.score });
  }

  public goAppStore(): void {
    let defaults = this.configProvider.getDefaults();
    let url;
    if (this.isAndroid)
      url =
        this.appName == 'Copay'
          ? defaults.rateApp.copay.android
          : defaults.rateApp.bitpay.android;
    if (this.isIOS)
      url =
        this.appName == 'Copay'
          ? defaults.rateApp.copay.ios
          : defaults.rateApp.bitpay.ios;

    this.externalLinkProvider.open(url);
    this.navCtrl.push(FeedbackCompletePage, {
      score: this.score,
      skipped: true,
      rated: true
    });
  }
}
