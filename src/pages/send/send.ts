import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';
import { AmountPage } from './amount/amount';

@Component({
  selector: 'page-send',
  templateUrl: 'send.html',
})
export class SendPage {

  constructor(public navCtrl: NavController, public navParams: NavParams) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SendPage');
  }

  openScanner() {
    this.navCtrl.parent.select(2);
  }

  findContact(search: string) {
    // TODO: Improve this function
    console.log("Send search string", search);
    if (search.length === 34  && _.startsWith(search, '1')) {
      this.navCtrl.push(AmountPage, {address: search});
    }
  }

}
