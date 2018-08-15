import { Component, Input } from '@angular/core';
import { TimeProvider } from '../../../providers/time/time';

@Component({
  selector: 'page-card-item',
  templateUrl: 'card-item.html'
})
export class CardItemPage {
  private _currency: string;
  private _card;
  public sent: boolean = false;
  public received: boolean = false;
  public pending: boolean = false;

  constructor(private timeProvider: TimeProvider) {}

  @Input()
  set card(card) {
    this._card = card;
    if (card.pending) {
      this.pending = true;
    } else if (card.price.toString().indexOf('-') > -1) {
      this.sent = true;
    } else {
      this.received = true;
    }
  }

  get card() {
    return this._card;
  }

  @Input()
  set currency(c) {
    this._currency = c;
  }

  get currency() {
    return this._currency;
  }

  public createdWithinPastDay(time) {
    return this.timeProvider.withinPastDay(time);
  }
}
