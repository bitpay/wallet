import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { AmountPage } from '../send/amount/amount';

@Component({
  selector: 'page-receive',
  templateUrl: 'receive.html',
})
export class ReceivePage {

  public protocolHandler: string;
  public address: string;
  public qrAddress: string;

  constructor(public navCtrl: NavController, public navParams: NavParams) {
    this.protocolHandler = "bitcoin";
    this.address = "1FgGP9dKqtWC1Q9xGhPYVmAeyezeZCFjhf";
    this.updateQrAddress();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ReceivePage');
  }

  requestSpecificAmount() {
    this.navCtrl.push(AmountPage, {address: this.address, sending: false});
  }

  setAddress() {
    this.address = this.address === "1FgGP9dKqtWC1Q9xGhPYVmAeyezeZCFjhf" ? "1RTes3reeRTs1Q9xGhPYVmQFrdUyCr3EsX" : "1FgGP9dKqtWC1Q9xGhPYVmAeyezeZCFjhf";
    this.updateQrAddress();
  }

  updateQrAddress () {
    this.qrAddress = this.protocolHandler + ":" + this.address;
  }

}
