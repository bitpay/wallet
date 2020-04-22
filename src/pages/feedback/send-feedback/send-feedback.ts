import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { ModalController, NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';
import { Observable } from 'rxjs';

// native
import { Device } from '@ionic-native/device';
import { LaunchReview } from '@ionic-native/launch-review';

// providers
import {
  ActionSheetProvider,
  InfoSheetType
} from '../../../providers/action-sheet/action-sheet';
import { AppProvider } from '../../../providers/app/app';
import { ConfigProvider } from '../../../providers/config/config';
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';
import { FeedbackProvider } from '../../../providers/feedback/feedback';
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { PlatformProvider } from '../../../providers/platform/platform';
import { PopupProvider } from '../../../providers/popup/popup';

// pages
import { FinishModalPage } from '../../finish/finish';
import { SharePage } from '../../settings/share/share';

@Component({
  selector: 'page-send-feedback',
  templateUrl: 'send-feedback.html'
})
export class SendFeedbackPage {
  @ViewChild('focusMe')
  feedbackTextarea;

  public feedback: string;
  public score: number;
  public reaction: string;
  public comment: string;
  public appName: string;
  public feedbackForm: FormGroup;
  public leavingFeedback: boolean;
  public isCordova: boolean;
  public fromCard: boolean;

  private isAndroid: boolean;

  constructor(
    private actionSheetProvider: ActionSheetProvider,
    private configProvider: ConfigProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private launchReview: LaunchReview,
    private modalCtrl: ModalController,
    private navCtrl: NavController,
    private navParams: NavParams,
    private platformProvider: PlatformProvider,
    private appProvider: AppProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private feedbackProvider: FeedbackProvider,
    private formBuilder: FormBuilder,
    private popupProvider: PopupProvider,
    private translate: TranslateService,
    private device: Device
  ) {
    this.feedbackForm = this.formBuilder.group({
      comment: [
        '',
        Validators.compose([Validators.minLength(1), Validators.required])
      ]
    });
    this.fromCard = this.navParams.data.fromCard;
    this.score = this.navParams.data.score;
    this.appName = this.appProvider.info.nameCase;
    this.leavingFeedback = false;
    this.isCordova = this.platformProvider.isCordova;
    this.isAndroid = this.platformProvider.isAndroid;
  }

  ionViewWillEnter() {
    switch (this.score) {
      case 1:
        this.reaction = this.translate.instant('Ouch!');
        this.comment = this.translate.instant(
          "There's obviously something we're doing wrong. How could we improve your experience?"
        );
        break;
      case 2:
        this.reaction = this.translate.instant('How can we improve?');
        this.comment = this.translate.instant(
          "We're always listening for ways we can improve your experience. Is there anything we could do to improve your experience?"
        );
        break;
      case 3:
        this.reaction = this.translate.instant('Thanks!');
        this.comment = this.translate.instant(
          "We're always listening for ways we can improve your experience. Feel free to leave us 5 star review in the app store or share with your friends!"
        );
        break;
      default:
        this.reaction = this.translate.instant('Feedback!');
        this.comment = this.translate.instant(
          "We're always listening for ways we can improve your experience. Feel free to leave us a review in the app store or request a new feature. Also, let us know if you experience any technical issues."
        );
        break;
    }
  }

  public showAppreciationSheet(): void {
    const storeName = this.isAndroid ? 'Play Store' : 'App Store';
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'appreciate-review',
      { storeName }
    );
    infoSheet.present();
    infoSheet.onDidDismiss(async option => {
      if (!option) return;
      if (this.launchReview.isRatingSupported()) {
        this.launchReview.rating();
      } else {
        await this.launchReview.launch();
      }
    });
  }

  public async leaveFeedback() {
    this.leavingFeedback = this.leavingFeedback ? false : true;
    if (this.leavingFeedback) {
      await Observable.timer(50).toPromise();
      this.feedbackTextarea.setFocus();
    }
  }

  public async openExternalLink(url: string): Promise<void> {
    await this.externalLinkProvider.open(url);
  }

  public goHome() {
    this.navCtrl.popToRoot({ animate: false });
  }

  public openSharePage(): void {
    this.navCtrl.push(SharePage);
  }

  public async sendFeedback(feedback: string, goHome: boolean): Promise<void> {
    const config = this.configProvider.get();

    let version;
    let platform;

    if (this.platformProvider.isElectron) {
      version = this.platformProvider
        .getDeviceInfo()
        .match(/(Electron[\/]\d+(\.\d)*)/i)[0]; // getDeviceInfo example: 5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Copay/5.1.0 Chrome/66.0.3359.181 Electron/3.0.8 Safari/537.36
      platform =
        this.platformProvider.getOS() && this.platformProvider.getOS().OSName;
    } else {
      version = this.device.version || 'Unknown version';
      platform = this.device.platform || 'Unknown platform';
    }

    const dataSrc = {
      email: _.values(config.emailFor)[0] || ' ',
      feedback: goHome ? ' ' : feedback,
      score: this.score || ' ',
      appVersion: this.appProvider.info.version,
      platform,
      deviceVersion: version
    };

    if (!goHome) this.onGoingProcessProvider.set('sendingFeedback');
    this.feedbackProvider
      .send(dataSrc)
      .then(async () => {
        if (goHome) return;
        this.onGoingProcessProvider.clear();
        const params: { finishText: string; finishComment?: string } = {
          finishText: 'Thanks',
          finishComment:
            'A member of the team will review your feedback as soon as possible.'
        };
        const modal = this.modalCtrl.create(FinishModalPage, params, {
          showBackdrop: true,
          enableBackdropDismiss: false
        });
        await modal.present();
        this.navCtrl.popToRoot({ animate: false });
      })
      .catch(() => {
        if (goHome) return;
        this.onGoingProcessProvider.clear();
        const title = this.translate.instant('Error');
        const subtitle = this.translate.instant(
          'Feedback could not be submitted. Please try again later.'
        );
        this.popupProvider.ionicAlert(title, subtitle);
      });
    if (goHome) {
      this.navCtrl.popToRoot({ animate: false });
    }
  }

  public showInfoSheet(key: InfoSheetType, externalLink: string): void {
    const infoSheet = this.actionSheetProvider.createInfoSheet(key);
    infoSheet.present();
    infoSheet.onDidDismiss(async option => {
      if (!option) {
        this.openExternalLink(externalLink);
      } else {
        // Click on Get Help
        this.openExternalLink('https://support.bitpay.com/hc/en-us');
      }
    });
  }
}
