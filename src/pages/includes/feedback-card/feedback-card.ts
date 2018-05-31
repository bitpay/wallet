import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events, NavController } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';

// providers
import { AppProvider } from '../../../providers/app/app';
import { PersistenceProvider } from '../../../providers/persistence/persistence';
import { PlatformProvider } from '../../../providers/platform/platform';
import { ReplaceParametersProvider } from '../../../providers/replace-parameters/replace-parameters';

// pages
import { FeedbackPage } from '../../../pages/feedback/feedback/feedback';
import { SendFeedbackPage } from '../../../pages/feedback/send-feedback/send-feedback';

@Component({
  selector: 'page-feedback-card',
  templateUrl: 'feedback-card.html'
})
export class FeedbackCardPage {
  public score: number;
  public button_title: string;
  public feedbackCardTitle: string;

  private isShowRateCard: boolean = false;
  private isCordova: boolean;

  constructor(
    private appProvider: AppProvider,
    private navCtrl: NavController,
    private logger: Logger,
    private persistenceProvider: PersistenceProvider,
    private events: Events,
    private translate: TranslateService,
    private platformProvider: PlatformProvider,
    private replaceParametersProvider: ReplaceParametersProvider
  ) {
    this.score = 0;
    this.isCordova = this.platformProvider.isCordova;
    let appName = this.appProvider.info.nameCase;
    this.feedbackCardTitle = this.replaceParametersProvider.replace(
      this.translate.instant('How do you like {{appName}}?'),
      { appName }
    );
  }

  public setShowRateCard(value) {
    this.isShowRateCard = value;
  }

  public hideCard(): void {
    this.isShowRateCard = false;
    this.logger.debug('Feedback card dismissed.');
    this.persistenceProvider.getFeedbackInfo().then((info: any) => {
      let feedbackInfo = info;
      feedbackInfo.sent = true;
      this.persistenceProvider.setFeedbackInfo(feedbackInfo);
    });
  }

  public setScore(score: number): any {
    this.score = score;
    switch (this.score) {
      case 1:
        this.button_title = this.translate.instant(
          'I think this app is terrible'
        );
        break;
      case 2:
        this.button_title = this.translate.instant("I don't like it");
        break;
      case 3:
        this.button_title = this.translate.instant("Meh - it's alright");
        break;
      case 4:
        this.button_title = this.translate.instant('I like the app');
        break;
      case 5:
        this.button_title = this.translate.instant('This app is fantastic!');
        break;
    }
  }

  public goFeedbackFlow(): void {
    this.hideCard();
    if (this.isCordova && this.score == 5) {
      this.navCtrl.push(FeedbackPage, { score: this.score });
    } else {
      this.navCtrl.push(SendFeedbackPage, { score: this.score });
    }
  }
}
