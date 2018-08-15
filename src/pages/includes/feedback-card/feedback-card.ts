import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';

// providers
import { AppProvider } from '../../../providers/app/app';
import { PersistenceProvider } from '../../../providers/persistence/persistence';
import { ReplaceParametersProvider } from '../../../providers/replace-parameters/replace-parameters';

// pages
import { SendFeedbackPage } from '../../../pages/feedback/send-feedback/send-feedback';

@Component({
  selector: 'page-feedback-card',
  templateUrl: 'feedback-card.html'
})
export class FeedbackCardPage {
  public score: number;
  public button_title: string;
  public feedbackCardTitle: string;
  public isShowRateCard: boolean;

  constructor(
    private appProvider: AppProvider,
    private navCtrl: NavController,
    private logger: Logger,
    private persistenceProvider: PersistenceProvider,
    private translate: TranslateService,
    private replaceParametersProvider: ReplaceParametersProvider
  ) {
    this.score = 0;
    this.isShowRateCard = false;
  }

  public setShowRateCard(value) {
    this.isShowRateCard = value;

    if (this.isShowRateCard) {
      let appName = this.appProvider.info.nameCase;
      this.feedbackCardTitle = this.replaceParametersProvider.replace(
        this.translate.instant(
          'How satisfied are you with {{appName}} wallet?'
        ),
        { appName }
      );
    }
  }

  public hideCard(): void {
    this.isShowRateCard = false;
    this.logger.debug('Feedback card dismissed.');
    this.persistenceProvider.getFeedbackInfo().then(info => {
      let feedbackInfo = info;
      feedbackInfo.sent = true;
      this.persistenceProvider.setFeedbackInfo(feedbackInfo);
    });
  }

  public setScore(score: number) {
    this.score = score;
    switch (this.score) {
      case 1:
        this.button_title = this.translate.instant("I'm disappointed");
        break;
      case 2:
        this.button_title = this.translate.instant("I'm satisfied");
        break;
      case 3:
        this.button_title = this.translate.instant("I'm very happy");
        break;
    }
  }

  public goFeedbackFlow(): void {
    this.hideCard();
    this.navCtrl.push(SendFeedbackPage, {
      score: this.score,
      fromCard: true
    });
  }
}
