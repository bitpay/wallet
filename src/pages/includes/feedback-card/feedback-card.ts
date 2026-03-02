import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';

// providers
import { AnalyticsProvider } from '../../../providers/analytics/analytics';
import { AppProvider } from '../../../providers/app/app';
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';
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
  public surveyCardShown: boolean;

  constructor(
    private appProvider: AppProvider,
    private navCtrl: NavController,
    private logger: Logger,
    private persistenceProvider: PersistenceProvider,
    private analyticsProvider: AnalyticsProvider,
    private translate: TranslateService,
    private replaceParametersProvider: ReplaceParametersProvider,
    private externalLinkProvider: ExternalLinkProvider
  ) {
    this.score = 0;
    this.isShowRateCard = false;
    this.surveyCardShown = false;
  }

  public setShowRateCard(value) {
    this.isShowRateCard = value;

    if (this.isShowRateCard) {
      let appName = this.appProvider.info.nameCase;
      this.feedbackCardTitle = this.replaceParametersProvider.replace(
        this.translate.instant('How satisfied are you with using {{appName}}?'),
        { appName }
      );
    }
  }

  public setShowSurveyCard(value: boolean = false) {
    this.surveyCardShown = value;
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

  public hideSurvey(): void {
    this.surveyCardShown = false;
    this.logger.debug('Survey card dismissed.');
    this.persistenceProvider.getFeedbackInfo().then(info => {
      let feedbackInfo = info;
      feedbackInfo.surveyTaken = true;
      this.persistenceProvider.setFeedbackInfo(feedbackInfo);
    });
  }

  public takeSurvey(): void {
    this.externalLinkProvider.open('https://payux.typeform.com/to/DWIC0Kky');
    this.hideSurvey();
  }

  public setScore(score: number) {
    this.score = score;
    switch (this.score) {
      case 1:
        this.button_title = this.translate.instant("I'm disappointed");
        break;
      case 2:
        this.button_title = this.translate.instant("It's ok for now");
        break;
      case 3:
        this.button_title = this.translate.instant('I love it!');
        break;
    }
  }

  public goFeedbackFlow(): void {
    this.hideCard();
    this.analyticsProvider.logEvent('feedback_card_app_sentiment', {
      happinessLevel: this.score
    });
    if (this.score == 1) {
      const url = 'https://payux.typeform.com/to/qYXqqa5q';
      this.externalLinkProvider.open(url);
      return;
    }

    if (this.score == 2) {
      const url = 'https://payux.typeform.com/to/MF01BBKt';
      this.externalLinkProvider.open(url);
      return;
    }

    this.navCtrl.push(SendFeedbackPage, {
      score: this.score,
      fromCard: true
    });
  }
}
