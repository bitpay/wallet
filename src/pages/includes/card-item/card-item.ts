import { Component, Input } from "@angular/core";
import { TimeProvider } from '../../../providers/time/time';

@Component({
  selector: 'page-card-item',
  templateUrl: 'card-item.html',
})
export class CardItemPage {
  private _currencySymbol: string;
  private _card: any;
  public sent: boolean = false;
  public received: boolean = false;
  public pending: boolean = false;

  constructor(
    private timeProvider: TimeProvider
  ) {
  }

  @Input()
  set card(card: any) {
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
  set currencySymbol(cs: any) {
    this._currencySymbol = cs;
  }

  get currencySymbol() {
    return this._currencySymbol;
  }

  public createdWithinPastDay(time: any): any {
    return this.timeProvider.withinPastDay(time);
  }
}
