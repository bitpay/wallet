import { Component } from '@angular/core';

import { InAppBrowserProvider, Logger } from '../../../../providers';

@Component({
  selector: 'bitpay-card-home-alt',
  templateUrl: 'bitpay-card-home.html'
})
export class BitPayCardHomeAlt {
  constructor(private logger: Logger, private iab: InAppBrowserProvider) {
    this.logger.log('card home initialized');
  }

  openCardDashboard() {
    this.iab.refs.card.show();
  }
}
