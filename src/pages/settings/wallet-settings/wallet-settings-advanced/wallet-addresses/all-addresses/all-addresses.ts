import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';

@Component({
  selector: 'page-all-addresses',
  templateUrl: 'all-addresses.html',
})
export class AllAddressesPage {
  public noBalance: any;
  public withBalance: any;
  public coin: string;

  constructor(
    private navParams: NavParams,
    private viewCtrl: ViewController
  ) {
    this.noBalance = this.navParams.data.noBalance;
    this.withBalance = this.navParams.data.withBalance;
    this.coin = this.navParams.data.coin;
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }
}