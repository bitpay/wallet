import { Component } from '@angular/core';
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
  public fromHomeCard: boolean;

  constructor() {
    super();
  }

  ngOnInit() {
    this.https = false;
    this.data = this.params.data.data;
    this.type = this.params.data.type;
    this.coin = this.params.data.coin;
    this.fromHomeCard = this.params.data.fromHomeCard;
    if (this.type === 'url') {
      this.https = this.data.indexOf('https://') === 0 ? true : false;
    }
  }

  public close(redirTo: string, value: string) {
    redirTo !== 'OpenExternalLink'
      ? this.dismiss({ redirTo, value, coin: this.coin })
      : this.dismissFunction &&
        this.dismissFunction({ redirTo, value, coin: this.coin });
  }
}
