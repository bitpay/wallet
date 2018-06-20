import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';

// native
import { SocialSharing } from '@ionic-native/social-sharing';

// providers
import { AppProvider } from '../../../providers/app/app';
import { ConfigProvider } from '../../../providers/config/config';
import { PersistenceProvider } from '../../../providers/persistence/persistence';
import { PlatformProvider } from '../../../providers/platform/platform';
import { PopupProvider } from '../../../providers/popup/popup';
import { ReplaceParametersProvider } from '../../../providers/replace-parameters/replace-parameters';

@Component({
  selector: 'page-feedback-complete',
  templateUrl: 'feedback-complete.html'
})
export class FeedbackCompletePage {
  public score: number;
  public skipped: boolean;
  public rated: boolean;
  public fromSettings: boolean;
  public facebook: boolean;
  public twitter: boolean;
  public googleplus: boolean;
  public email: boolean;
  public whatsapp: boolean;
  public isCordova: boolean;
  public title: string;

  private downloadUrl: string;
  private shareFacebookVia: string;
  private shareTwitterVia: string;

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private viewCtrl: ViewController,
    private logger: Logger,
    private platformProvider: PlatformProvider,
    private persistenceProvider: PersistenceProvider,
    private socialSharing: SocialSharing,
    private appProvider: AppProvider,
    private configProvider: ConfigProvider,
    private replaceParametersProvider: ReplaceParametersProvider,
    private translate: TranslateService,
    private popupProvider: PopupProvider
  ) {
    this.score = this.navParams.data.score;
    this.skipped = this.navParams.data.skipped;
    this.rated = this.navParams.data.rated;
    this.fromSettings = this.navParams.data.fromSettings;
    this.isCordova = this.platformProvider.isCordova;
    this.title = this.replaceParametersProvider.replace(
      this.translate.instant('Share {{appName}}'),
      { appName: this.appProvider.info.nameCase }
    );
    let defaults = this.configProvider.getDefaults();
    this.downloadUrl =
      this.appProvider.info.name == 'copay'
        ? defaults.download.copay.url
        : defaults.download.bitpay.url;
  }

  ionViewWillLeave() {
    if (!this.fromSettings) {
      this.navCtrl.swipeBackEnabled = true;
    }
  }

  ionViewWillEnter() {
    if (!this.fromSettings) {
      this.viewCtrl.showBackButton(false);
      this.navCtrl.swipeBackEnabled = false;
    }

    this.persistenceProvider.getFeedbackInfo().then(info => {
      let feedbackInfo = info;
      feedbackInfo.sent = true;
      this.persistenceProvider.setFeedbackInfo(feedbackInfo);
    });

    if (!this.isCordova) return;

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
            this.logger.debug('facebook error: ' + e);
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
            this.logger.debug('twitter error: ' + e);
            this.twitter = false;
          });
      });
    this.socialSharing
      .canShareVia('whatsapp', 'msg', null, null, null)
      .then(() => {
        this.whatsapp = true;
      })
      .catch(e => {
        this.logger.debug('whatsapp error: ' + e);
        this.whatsapp = false;
      });
  }

  public shareFacebook() {
    if (!this.facebook) {
      this.showError();
      return;
    }
    this.socialSharing.shareVia(
      this.shareFacebookVia,
      null,
      null,
      null,
      this.downloadUrl
    );
  }

  public shareTwitter() {
    if (!this.twitter) {
      this.showError();
      return;
    }
    this.socialSharing.shareVia(
      this.shareTwitterVia,
      null,
      null,
      null,
      this.downloadUrl
    );
  }

  public shareWhatsapp() {
    if (!this.whatsapp) {
      this.showError();
      return;
    }
    this.socialSharing.shareViaWhatsApp(this.downloadUrl);
  }

  private showError() {
    let msg = this.translate.instant(
      'This app is not available for your device.'
    );
    this.popupProvider.ionicAlert(this.translate.instant('Error'), msg);
  }

  public close(): void {
    this.navCtrl.popToRoot({ animate: false });
  }
}
