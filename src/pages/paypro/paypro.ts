import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';

@Component({
  selector: 'page-payrpo',
  templateUrl: 'paypro.html',
})
export class PayProPage {

  public tx: any;

  constructor(
    private navParams: NavParams,
    private viewCtrl: ViewController
  ) {
    this.tx = this.navParams.data.tx;
  }

  close() {
    this.viewCtrl.dismiss();
  }
}