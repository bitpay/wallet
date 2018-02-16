import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { NavController, NavParams, Platform } from 'ionic-angular';
import * as _ from "lodash";

//providers
import { AppProvider } from '../../../providers/app/app';
import { ConfigProvider } from '../../../providers/config/config';
import { FeedbackProvider } from '../../../providers/feedback/feedback';
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { PopupProvider } from '../../../providers/popup/popup';

//pages
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

  public ionViewWillEnter() {

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

    const config: any = this.configProvider.get();

    const platform = this.platform.platforms().join("");
    let versions: any = this.platform.versions();
    versions = _.values(_.pickBy(versions, _.identity)) //remove undefined and get array of versions
    const version: any = versions && versions[0] ? versions[0] : null;
    const versionStr = version ? version.str : '';

    const dataSrc = {
      "email": _.values(config.emailFor)[0] || ' ',
      "feedback": goHome ? ' ' : feedback,
      "score": this.score || ' ',
      "appVersion": this.appProvider.info.version,
      "platform": platform,
      "deviceVersion": versionStr
    };

    if (!goHome) { this.onGoingProcessProvider.set('sendingFeedback', true); }
    this.feedbackProvider.send(dataSrc).then(() => {
      if (goHome) { return; }
      this.onGoingProcessProvider.set('sendingFeedback', false);
      if (!this.score) {
        const title = this.translate.instant('Thank you!');
        const message = this.translate.instant('A member of the team will review your feedback as soon as possible.');
        const okText = this.translate.instant('Finish');
        this.popupProvider.ionicAlert(title, message, okText).then(() => {
          this.feedback = '';
          this.navCtrl.pop();
        });
      }
      else {
        this.navCtrl.push(FeedbackCompletePage, { score: this.score })
      }
    }).catch((err) => {
      if (goHome) { return; }
      this.onGoingProcessProvider.set('sendingFeedback', false);
      const title = this.translate.instant('Error');
      const subtitle = this.translate.instant('Feedback could not be submitted. Please try again later.');
      this.popupProvider.ionicAlert(title, subtitle);
    });
    if (goHome) { this.navCtrl.push(HomePage); }
  }

  public goBack(): void {
    this.navCtrl.pop();
  }
}
