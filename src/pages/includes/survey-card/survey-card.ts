import { Component } from '@angular/core';

// Providers
import {
  ExternalLinkProvider,
  Logger,
  PersistenceProvider
} from '../../../providers';

@Component({
  selector: 'page-survey-card',
  templateUrl: 'survey-card.html'
})
export class SurveyCardPage {
  public showSurveyCard: boolean;
  public surveyCardBody: string;
  constructor(
    private externalLinkProvider: ExternalLinkProvider,
    private logger: Logger,
    private persistenceProvider: PersistenceProvider
  ) {
    this.showSurveyCard = false;
  }

  public setShowSurveyCard(value) {
    this.showSurveyCard = value;
  }

  public hideCard(): void {
    this.showSurveyCard = false;
    this.logger.debug('Survey card dismissed.');
    this.persistenceProvider.setSurveyFlag();
  }

  public openSurveyInBrowser(): void {
    this.hideCard();
    this.externalLinkProvider.open('https://bitpayux.typeform.com/to/z81Jp7');
  }
}
