import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';


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
    this.address = this.navParams.data.toAddress;
    this.amount = this.navParams.data.amount;
    this.updateQrAddress();
  }

  updateQrAddress() {
    this.qrAddress = this.protocolHandler + ":" + this.address + "?amount=" + this.amount;
  }

}
