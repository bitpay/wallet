import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { NavController, NavParams, Platform } from 'ionic-angular';
import * as _ from "lodash";

// providers
import { AppProvider } from '../../../providers/app/app';
import { ConfigProvider } from '../../../providers/config/config';
import { FeedbackProvider } from '../../../providers/feedback/feedback';
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { PopupProvider } from '../../../providers/popup/popup';

// pages
import { HomePage } from '../../home/home';
import { FeedbackCompletePage } from '../feedback-complete/feedback-complete';


@Component({
  selector: 'page-send-feedback',
  templateUrl: 'send-feedback.html',
})
export class SendFeedbackPage {

  public feedback: string;
  public score: number;
  public reaction: string;
  public comment: string;
  public justFeedback: boolean;
  public appName: string;
  public feedbackForm: FormGroup;

  constructor(
    private configProvider: ConfigProvider,
    private navCtrl: NavController,
    private navParams: NavParams,
    private appProvider: AppProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private feedbackProvider: FeedbackProvider,
    private formBuilder: FormBuilder,
    private popupProvider: PopupProvider,
    private translate: TranslateService,
    private platform: Platform
  ) {
    this.feedbackForm = this.formBuilder.group({
      comment: ['', Validators.compose([Validators.minLength(1), Validators.required])]
    });
    this.score = this.navParams.data.score;
    this.appName = this.appProvider.info.nameCase;
  }

  ionViewWillEnter() {

    switch (this.score) {
      case 1:
        this.reaction = this.translate.instant("Ouch!");
        this.comment = this.translate.instant("There's obviously something we're doing wrong. How could we improve your experience?");
        break;
      case 2:
        this.reaction = this.translate.instant("Oh no!");
        this.comment = this.translate.instant("There's obviously something we're doing wrong. How could we improve your experience?");
        break;
      case 3:
        this.reaction = this.translate.instant("Hmm...");
        this.comment = this.translate.instant("We'd love to do better. How could we improve your experience?");
        break;
      case 4:
        this.reaction = this.translate.instant("Thanks!");
        this.comment = this.translate.instant("That's exciting to hear. We'd love to earn that fifth star from you – how could we improve your experience?");
        break;
      case 5:
        this.reaction = this.translate.instant("Thank you!");
        this.comment = "We're always looking for ways to improve" + " " + this.appName + ". Is there anything we could do better?"; // TODO: translate
        break;
      default:
        this.justFeedback = true;
        this.comment = "We're always looking for ways to improve" + " " + this.appName + ". How could we improve your experience?"; // TODO: translate
        break;
    }
  }

  public sendFeedback(feedback: string, goHome: boolean): void {

    let config: any = this.configProvider.get();

    let platform = this.platform.platforms().join("");
    let versions: any = this.platform.versions();
    versions = _.values(_.pickBy(versions, _.identity)) // remove undefined and get array of versions
    let version: any = versions && versions[0] ? versions[0] : null;
    let versionStr = version ? version.str : '';

    let dataSrc = {
      "email": _.values(config.emailFor)[0] || ' ',
      "feedback": goHome ? ' ' : feedback,
      "score": this.score || ' ',
      "appVersion": this.appProvider.info.version,
      "platform": platform,
      "deviceVersion": versionStr
    };

    if (!goHome) this.onGoingProcessProvider.set('sendingFeedback');
    this.feedbackProvider.send(dataSrc).then(() => {
      if (goHome) return;
      this.onGoingProcessProvider.clear();
      if (!this.score) {
        let title = this.translate.instant('Thank you!');
        let message = this.translate.instant('A member of the team will review your feedback as soon as possible.');
        let okText = this.translate.instant('Finish');
        this.popupProvider.ionicAlert(title, message, okText).then(() => {
          this.feedback = '';
          this.navCtrl.pop();
        });
      }
      else {
        this.navCtrl.push(FeedbackCompletePage, { score: this.score })
      }
    }).catch((err) => {
      if (goHome) return;
      this.onGoingProcessProvider.clear();
      let title = this.translate.instant('Error');
      let subtitle = this.translate.instant('Feedback could not be submitted. Please try again later.');
      this.popupProvider.ionicAlert(title, subtitle);
    });
    if (goHome) this.navCtrl.push(HomePage);
  }

  public goBack(): void {
    this.navCtrl.pop();
  }
}
