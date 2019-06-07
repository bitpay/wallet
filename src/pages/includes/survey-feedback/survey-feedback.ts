import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

// Providers
import { ExternalLinkProvider, Logger, PersistenceProvider } from '../../../providers';
import { AppProvider } from '../../../providers/app/app';
import { ReplaceParametersProvider } from '../../../providers/replace-parameters/replace-parameters';

@Component({
  selector: 'page-survey-feedback',
  templateUrl: 'survey-feedback.html'
})
export class SurveyFeedbackPage {
  public isShowSurveyCard: boolean;
  public feedbackCardBody: string;
  constructor(
    private appProvider: AppProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private logger: Logger,
    private persistenceProvider: PersistenceProvider,
    private translate: TranslateService,
    private replaceParametersProvider: ReplaceParametersProvider
  ) {
    this.isShowSurveyCard = false;
  }

  public setShowSurveyCard(value) {
    this.isShowSurveyCard = value;

    if (this.isShowSurveyCard) {
      let appName = this.appProvider.info.nameCase;
      this.feedbackCardBody = this.replaceParametersProvider.replace(
        this.translate.instant(
          'Anonymously take a brief 2 minute survey in order to help us improve the {{appName}} experience.'
        ),
        { appName }
      );
    }
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
