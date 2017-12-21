import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

@Component({
  selector: 'page-sell-coinbase',
  templateUrl: 'sell-coinbase.html',
})
export class SellCoinbasePage {

  constructor(public navCtrl: NavController, public navParams: NavParams) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SellCoinbasePage');
  }

}
