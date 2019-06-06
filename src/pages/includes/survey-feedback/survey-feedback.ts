import { Component } from '@angular/core';

// Providers
import { ExternalLinkProvider, Logger, PersistenceProvider } from '../../../providers';

@Component({
  selector: 'page-survey-feedback',
  templateUrl: 'survey-feedback.html'
})
export class SurveyFeedbackPage {
  public isShowSurveyCard: boolean;
  constructor(
    private externalLinkProvider: ExternalLinkProvider,
    private logger: Logger,
    private persistenceProvider: PersistenceProvider,
  ) {
    this.isShowSurveyCard = false;
  }

  public setShowSurveyCard(value) {
    this.isShowSurveyCard = value;
  }

  public hideCard(): void {
    this.isShowSurveyCard = false;
    this.logger.debug('Feedback card dismissed.');
    this.persistenceProvider.getFeedbackInfo().then(info => {
      let feedbackInfo = info;
      feedbackInfo.sent = true;
      this.persistenceProvider.setFeedbackInfo(feedbackInfo);
    });
  }

  public async openSurveyInBrowser(): Promise<void> {
    this.hideCard();
    await this.externalLinkProvider.open('https://bitpayux.typeform.com/to/z81Jp7');
  }
}
