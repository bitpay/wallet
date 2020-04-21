import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Logger } from '../../../providers/logger/logger';

// native
import { SocialSharing } from '@ionic-native/social-sharing';

// providers
import { AnalyticsProvider } from '../../../providers/analytics/analytics';
import { AppProvider } from '../../../providers/app/app';
import { ConfigProvider } from '../../../providers/config/config';
import { PopupProvider } from '../../../providers/popup/popup';
import { ReplaceParametersProvider } from '../../../providers/replace-parameters/replace-parameters';

@Component({
  selector: 'page-share',
  templateUrl: 'share.html'
})
export class SharePage {
  public title: string;

  private facebook: boolean;
  private twitter: boolean;
  private whatsapp: boolean;
  private downloadUrl: string;
  private downloadText: string;
  private shareFacebookVia: string;
  private shareTwitterVia: string;

  constructor(
    private logger: Logger,
    private socialSharing: SocialSharing,
    private appProvider: AppProvider,
    private configProvider: ConfigProvider,
    private replaceParametersProvider: ReplaceParametersProvider,
    private translate: TranslateService,
    private popupProvider: PopupProvider,
    private analyticsProvider: AnalyticsProvider
  ) {
    this.title = this.replaceParametersProvider.replace(
      this.translate.instant('Share {{appName}}'),
      { appName: this.appProvider.info.nameCase }
    );
    let defaults = this.configProvider.getDefaults();
    this.downloadUrl =
      this.appProvider.info.name == 'copay'
        ? defaults.download.copay.url
        : defaults.download.bitpay.url;
    this.downloadText = this.replaceParametersProvider.replace(
      this.translate.instant(
        'Spend and control your cryptocurrency by downloading the {{appName}} app.'
      ),
      { appName: this.appProvider.info.nameCase }
    );
  }

  ionViewWillEnter() {
    this.socialSharing
      .canShareVia('com.apple.social.facebook', 'msg', null, null, null)
      .then(() => {
        this.shareFacebookVia = 'com.apple.social.facebook';
        this.facebook = true;
      })
      .catch(() => {
        this.socialSharing
          .canShareVia('com.facebook.katana', 'msg', null, null, null)
          .then(() => {
            this.shareFacebookVia = 'com.facebook.katana';
            this.facebook = true;
          })
          .catch(e => {
            this.logger.error('facebook error: ' + e);
            this.facebook = false;
          });
      });
    this.socialSharing
      .canShareVia('com.apple.social.twitter', 'msg', null, null, null)
      .then(() => {
        this.shareTwitterVia = 'com.apple.social.twitter';
        this.twitter = true;
      })
      .catch(() => {
        this.socialSharing
          .canShareVia('com.twitter.android', 'msg', null, null, null)
          .then(() => {
            this.shareTwitterVia = 'com.twitter.android';
            this.twitter = true;
          })
          .catch(e => {
            this.logger.error('twitter error: ' + e);
            this.twitter = false;
          });
      });
    this.socialSharing
      .canShareVia('whatsapp', 'msg', null, null, null)
      .then(() => {
        this.whatsapp = true;
      })
      .catch(e => {
        this.logger.error('whatsapp error: ' + e);
        this.whatsapp = false;
      });
  }

  public shareFacebook() {
    this.analyticsProvider.logEvent('share', { method: 'Facebook' });
    if (!this.facebook) {
      this.showError();
      return;
    }
    this.socialSharing.shareVia(
      this.shareFacebookVia,
      this.downloadText,
      null,
      null,
      this.downloadUrl
    );
  }

  public shareTwitter() {
    this.analyticsProvider.logEvent('share', { method: 'Twitter' });
    if (!this.twitter) {
      this.showError();
      return;
    }
    this.socialSharing.shareVia(
      this.shareTwitterVia,
      this.downloadText,
      null,
      null,
      this.downloadUrl
    );
  }

  public shareWhatsapp() {
    this.analyticsProvider.logEvent('share', { method: 'Whatsapp' });
    if (!this.whatsapp) {
      this.showError();
      return;
    }
    this.socialSharing.shareViaWhatsApp(
      this.downloadText,
      null,
      this.downloadUrl
    );
  }

  private showError() {
    let msg = this.translate.instant(
      'This app is not available for your device.'
    );
    this.popupProvider.ionicAlert(this.translate.instant('Error'), msg);
  }
}
