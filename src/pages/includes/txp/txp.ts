import { Component, Input } from "@angular/core";
import { TimeProvider } from '../../../providers/time/time';

@Component({
  selector: 'page-txp',
  templateUrl: 'txp.html',
})
export class TxpPage {
  private _tx: any;
  private _addressbook: any;

  constructor(
    private timeProvider: TimeProvider
  ) {
  }

  @Input()
  set tx(tx: any) {
    this._tx = tx;
  }

  get tx() {
    return this._tx;
  }

  @Input()
  set addressbook(addressbook: any) {
    this._addressbook = addressbook;
  }

  get addressbook() {
    return this._addressbook;
  }

  public createdWithinPastDay(time: any): any {
    return this.timeProvider.withinPastDay(time);
  }
}