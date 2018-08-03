import { Component } from '@angular/core';
import { Events } from 'ionic-angular';
import { ActionSheetParent } from '../action-sheet/action-sheet-parent';

@Component({
  selector: 'incoming-data-menu',
  templateUrl: 'incoming-data-menu.html'
})
export class IncomingDataMenuComponent extends ActionSheetParent {
  public https: boolean;
  public data: string;
  public type: string;
  public coin: string;

  constructor(private events: Events) {
    super();
  }

  ngOnInit() {
    this.https = false;
    this.data = this.params.data.data;
    this.type = this.params.data.type;
    this.coin = this.params.data.coin;
    if (this.type === 'url') {
      this.https = this.data.indexOf('https://') === 0 ? true : false;
    }
  }

  public backdropDismiss(): void {
    this.close(null, null);
  }

  public close(redirTo: string, value: string) {
    if (redirTo == 'AmountPage') {
      let coin = this.coin ? this.coin : 'btc';
      this.events.publish('finishIncomingDataMenuEvent', {
        redirTo,
        value,
        coin
      });
    } else {
      this.events.publish('finishIncomingDataMenuEvent', { redirTo, value });
    }

    if (redirTo != 'OpenExternalLink') {
      this.dismiss();
    }
  }
}
