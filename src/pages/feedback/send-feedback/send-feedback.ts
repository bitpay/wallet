import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';

//providers
import { ConfigProvider } from '../../../providers/config/config';
import { AppProvider } from '../../../providers/app/app';
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { FeedbackProvider } from '../../../providers/feedback/feedback';
import { PopupProvider } from '../../../providers/popup/popup';
import { PlatformProvider } from '../../../providers/platform/platform';

//pages
import { FeedbackCompletePage } from '../feedback-complete/feedback-complete';
import { HomePage } from '../../home/home';

import * as _ from "lodash";

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
    private platformProvider: PlatformProvider
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
        this.reaction = "Ouch!";
        this.comment = "There's obviously something we're doing wrong. How could we improve your experience?"; //TODO gettextcatalog
        break;
      case 2:
        this.reaction = "Oh no!";
        this.comment = "There's obviously something we're doing wrong. How could we improve your experience?"; //TODO gettextcatalog
        break;
      case 3:
        this.reaction = "Hmm...";
        this.comment = "We'd love to do better. How could we improve your experience?"; //TODO gettextcatalog
        break;
      case 4:
        this.reaction = "Thanks!";
        this.comment = "That's exciting to hear. We'd love to earn that fifth star from you – how could we improve your experience?"; //TODO gettextcatalog
        break;
      case 5:
        this.reaction = "Thank you!";
        this.comment = "We're always looking for ways to improve " + this.appName + ". Is there anything we could do better?";
        break;
      default:
        this.justFeedback = true;
        this.comment = "We're always looking for ways to improve " + this.appName + ". How could we improve your experience?";
        break;
    }
  }

  public sendFeedback(feedback: string, goHome: boolean): void {

    let config: any = this.configProvider.get();

    let dataSrc = {
      "email": _.values(config.emailFor)[0] || ' ',
      "feedback": goHome ? ' ' : feedback,
      "score": this.score || ' ',
      "appVersion": this.appProvider.info.version,
      "platform": 'platform', //TODO ionic.Platform.platform()
      "deviceVersion": 'version' //TODO ionic.Platform.version()
    };

    if (!goHome) this.onGoingProcessProvider.set('sendingFeedback', true);
    this.feedbackProvider.send(dataSrc).then(() => {
      if (goHome) return;
      this.onGoingProcessProvider.set('sendingFeedback', false);
      if (!this.score) {
        let title = 'Thank you!'; //TODO gettextcatalog
        let message = 'A member of the team will review your feedback as soon as possible.'; //TODO gettextcatalog
        let okText = 'Finish'; //TODO gettextcatalog
        this.popupProvider.ionicAlert(title, message).then(() => {
          this.feedback = '';
          this.navCtrl.pop();
        });
      }
      else {
        this.navCtrl.push(FeedbackCompletePage, { score: this.score })
      }
    }).catch((err) => {
      if (goHome) return;
      this.onGoingProcessProvider.set('sendingFeedback', false);
      this.popupProvider.ionicAlert('Error', 'Feedback could not be submitted. Please try again later.'); //TODO gettextcatalog
    });
    if (goHome) this.navCtrl.push(HomePage);
  }

  public goBack(): void {
    this.navCtrl.pop();
  }
}
