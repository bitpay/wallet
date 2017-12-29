import { Component } from '@angular/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';

//native
import { SocialSharing } from '@ionic-native/social-sharing';

//providers
import { PersistenceProvider } from '../../../providers/persistence/persistence';
import { PlatformProvider } from '../../../providers/platform/platform';
import { AppProvider } from '../../../providers/app/app';
import { ConfigProvider } from '../../../providers/config/config';

//pages
import { HomePage } from '../../home/home';

@Component({
  selector: 'page-feedback-complete',
  templateUrl: 'feedback-complete.html',
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
  private shareGooglePlusVia: string;

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private viewCtrl: ViewController,
    private logger: Logger,
    private platformProvider: PlatformProvider,
    private persistenceProvider: PersistenceProvider,
    private socialSharing: SocialSharing,
    private appProvider: AppProvider,
    private configProvider: ConfigProvider
  ) {
    this.score = this.navParams.data.score;
    this.skipped = this.navParams.data.skipped;
    this.rated = this.navParams.data.rated;
    this.fromSettings = this.navParams.data.fromSettings;
    this.isCordova = this.platformProvider.isCordova;
    this.title = "Share " + this.appProvider.info.nameCase;
    let defaults = this.configProvider.getDefaults();
    this.downloadUrl = this.appProvider.info.name == 'copay' ? defaults.download.copay.url : defaults.download.bitpay.url;
    if (!this.fromSettings) {
      this.viewCtrl.showBackButton(false);
    } else {
      this.viewCtrl.showBackButton(true);
    }
  }

  ionViewWillEnter() {
    this.persistenceProvider.getFeedbackInfo().then((info: any) => {
      let feedbackInfo = info;
      feedbackInfo.sent = true;
      this.persistenceProvider.setFeedbackInfo(feedbackInfo);
    });

    if (!this.isCordova) return;

    this.socialSharing.canShareVia('com.apple.social.facebook', 'msg', null, null, null).then(() => {
      this.shareFacebookVia = 'com.apple.social.facebook';
      this.facebook = true;
    }).catch((e) => {
      this.socialSharing.canShareVia('com.facebook.katana', 'msg', null, null, null).then(() => {
        this.shareFacebookVia = 'com.facebook.katana';
        this.facebook = true;
      }).catch((e) => {
        this.logger.debug('facebook error: ' + e);
        this.facebook = false;
      });
    });
    this.socialSharing.canShareVia('com.apple.social.twitter', 'msg', null, null, null).then(() => {
      this.shareTwitterVia = 'com.apple.social.twitter';
      this.twitter = true;
    }).catch((e) => {
      this.socialSharing.canShareVia('com.twitter.android', 'msg', null, null, null).then(() => {
        this.shareTwitterVia = 'com.twitter.android';
        this.twitter = true;
      }).catch((e) => {
        this.logger.debug('twitter error: ' + e);
        this.twitter = false;
      });
    });
    this.socialSharing.canShareVia('whatsapp', 'msg', null, null, null).then(() => {
      this.whatsapp = true;
    }).catch((e) => {
      this.logger.debug('whatsapp error: ' + e);
      this.whatsapp = false;
    });
  }

  public shareFacebook() {
    this.socialSharing.shareVia(this.shareFacebookVia, null, null, null, this.downloadUrl);
  };

  public shareTwitter() {
    this.socialSharing.shareVia(this.shareTwitterVia, null, null, null, this.downloadUrl);
  };

  public shareWhatsapp() {
    this.socialSharing.shareViaWhatsApp(this.downloadUrl);
  };

  public close(): void {
    this.navCtrl.setRoot(HomePage);
  }
}
