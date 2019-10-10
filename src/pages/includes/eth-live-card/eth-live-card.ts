import { Component, EventEmitter, Output } from '@angular/core';

// Providers
import { Logger, PersistenceProvider } from '../../../providers';

@Component({
  selector: 'page-eth-live-card',
  templateUrl: 'eth-live-card.html'
})
export class EthLiveCardPage {
  @Output() addEthClicked = new EventEmitter<any>();

  public showEthLiveCard: boolean;
  constructor(
    private logger: Logger,
    private persistenceProvider: PersistenceProvider
  ) {
    this.showEthLiveCard = false;
  }

  public setShowEthLiveCard(value) {
    this.showEthLiveCard = value;
  }

  public hideCard(): void {
    this.showEthLiveCard = false;
    this.logger.debug('ETH live card dismissed.');
    this.persistenceProvider.setEthLiveCardFlag();
  }

  public goToAddWalletFlow(): void {
    this.addEthClicked.next();
    this.hideCard();
  }
}
