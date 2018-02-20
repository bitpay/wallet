import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';

@Component({
  selector: 'page-incoming-data-menu',
  templateUrl: 'incoming-data-menu.html',
})
export class IncomingDataMenuPage {
  public https: boolean;

  public data: string;
  public type: string;
  public coin: string;

  constructor(
    private viewCtrl: ViewController,
    private navParams: NavParams,
  ) {
    this.https = false;
  }

  ionViewDidLoad() {
    this.data = this.navParams.data.data;
    this.type = this.navParams.data.type;
    this.coin = this.navParams.data.coin;
    if (this.type === 'url') {
      if (this.data.indexOf('https://') === 0) {
        this.https = true;
      }
    }
  }

  public close(redirTo: string, value: string) {
    if (redirTo == 'AmountPage') {
      let coin = this.coin ? this.coin : 'btc';
      this.viewCtrl.dismiss({ redirTo, value, coin });
      return;
    }
    this.viewCtrl.dismiss({ redirTo, value });
  }
}