import { Component, Input } from '@angular/core';

@Component({
  selector: 'page-wallet-activity',
  templateUrl: 'wallet-activity.html'
})
export class WalletActivityPage {
  private _notification;

  @Input()
  set notification(notification) {
    this._notification = notification;
  }

  get notification() {
    return this._notification;
  }
}
