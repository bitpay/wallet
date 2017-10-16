import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import * as _ from 'lodash';
import { AmountPage } from './amount/amount';

@Component({
  selector: 'page-send',
  templateUrl: 'send.html',
})
export class SendPage {
  public search: string;

  constructor(public navCtrl: NavController) {
  }
  
  ionViewDidLoad() {
    this.search = '';
    console.log('ionViewDidLoad SendPage');
  }

  openScanner() {
    this.navCtrl.parent.select(2);
  }

  findContact(search: string) {
    // TODO: Improve this function
    console.log("Send search string", search);
    if (search.length === 34) {
      this.navCtrl.push(AmountPage, {address: search, sending: true});
    }
  }

}
