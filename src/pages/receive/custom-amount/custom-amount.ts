import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

/**
 * Generated class for the CustomAmountPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@Component({
  selector: 'page-custom-amount',
  templateUrl: 'custom-amount.html',
})
export class CustomAmountPage {

  public protocolHandler: string;
  public address: string;
  public amount: string;
  public qrAddress: string;

  constructor(public navCtrl: NavController, public navParams: NavParams) {
    this.protocolHandler = "bitcoin";
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad CustomAmountPage');
    this.address = this.navParams.data.address;
    this.amount = this.navParams.data.amount;
    this.updateQrAddress();
  }

  updateQrAddress () {
    this.qrAddress = this.protocolHandler + ":" + this.address + "?amount=" + this.amount;
  }

}
