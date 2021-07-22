import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

// native
import { SocialSharing } from '@ionic-native/social-sharing';

// providers
import { AnalyticsProvider } from '../../../providers/analytics/analytics';
import { AppProvider } from '../../../providers/app/app';
import { ConfigProvider } from '../../../providers/config/config';
import { Logger } from '../../../providers/logger/logger';
import { PlatformProvider } from '../../../providers/platform/platform';
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

  private options;

  constructor(
    private logger: Logger,
    private socialSharing: SocialSharing,
    private appProvider: AppProvider,
    private configProvider: ConfigProvider,
    private platformProvider: PlatformProvider,
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

    this.options = {
      message: this.downloadText,
      subject: '',
      files: [],
      url: this.downloadUrl,
      chooserTitle: this.appProvider.info.nameCase,
      appPackageName: ''
    };
  }

  ionViewWillEnter() {
    this.socialSharing
      .canShareVia(
        this.platformProvider.isIOS
          ? 'com.apple.social.facebook'
          : 'com.facebook.katana',
        'msg',
        null,
        null,
        null
      )
      .then(() => {
        this.shareFacebookVia = this.platformProvider.isIOS
          ? 'com.apple.social.facebook'
          : 'com.facebook.katana';
        this.facebook = true;
      })
      .catch(() => {
        this.logger.error('No facebook app found.');
        this.facebook = false;
      });
    this.socialSharing
      .canShareVia(
        this.platformProvider.isIOS
          ? 'com.apple.social.twitter'
          : 'com.twitter.android',
        'msg',
        null,
        null,
        null
      )
      .then(() => {
        this.shareTwitterVia = this.platformProvider.isIOS
          ? 'com.apple.social.twitter'
          : 'com.twitter.android';
        this.twitter = true;
      })
      .catch(() => {
        this.logger.error('No twitter app found.');
        this.twitter = false;
      });
    this.socialSharing
      .canShareVia('whatsapp', 'msg', null, null, null)
      .then(() => {
        this.whatsapp = true;
      })
      .catch(() => {
        this.logger.error('No whatsapp app found.');
        this.whatsapp = false;
      });
  }

  public shareFacebook() {
    this.analyticsProvider.logEvent('share', { method: 'Facebook' });
    if (!this.facebook) {
      this.showError();
      return;
    }
    this.options.appPackageName = this.shareFacebookVia;
    if (this.platformProvider.isAndroid) this.appProvider.skipLockModal = true;
    this.socialSharing.shareWithOptions(this.options);
  }

  public shareTwitter() {
    this.analyticsProvider.logEvent('share', { method: 'Twitter' });
    if (!this.twitter) {
      this.showError();
      return;
    }
    this.options.appPackageName = this.shareTwitterVia;
    if (this.platformProvider.isAndroid) this.appProvider.skipLockModal = true;
    this.socialSharing.shareWithOptions(this.options);
  }

  public shareWhatsapp() {
    this.analyticsProvider.logEvent('share', { method: 'Whatsapp' });
    if (!this.whatsapp) {
      this.showError();
      return;
    }
    this.options.appPackageName = 'whatsapp';
    if (this.platformProvider.isAndroid) this.appProvider.skipLockModal = true;
    this.socialSharing.shareWithOptions(this.options);
  }

  private showError() {
    let msg = this.translate.instant(
      'This app is not available for your device.'
    );
    this.popupProvider.ionicAlert(this.translate.instant('Error'), msg);
  }
}
