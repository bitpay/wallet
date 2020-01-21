import { Component, EventEmitter, Output } from '@angular/core';

// Providers
import { Logger, PersistenceProvider } from '../../../providers';

@Component({
  selector: 'page-xrp-live-card',
  templateUrl: 'xrp-live-card.html'
})
export class XrpLiveCardPage {
  @Output() addXrpClicked = new EventEmitter<any>();

  public showXrpLiveCard: boolean;
  constructor(
    private logger: Logger,
    private persistenceProvider: PersistenceProvider
  ) {
    this.showXrpLiveCard = false;
  }

  public setShowXrpLiveCard(value) {
    this.showXrpLiveCard = value;
  }

  public hideCard(): void {
    this.showXrpLiveCard = false;
    this.logger.debug('XRP live card dismissed.');
    this.persistenceProvider.setXrpLiveCardFlag();
  }

  public goToAddWalletFlow(): void {
    this.addXrpClicked.next();
    this.hideCard();
  }
}
