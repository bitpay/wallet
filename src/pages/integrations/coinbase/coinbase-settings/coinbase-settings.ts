import { Component } from '@angular/core';
import { ViewController, NavParams } from 'ionic-angular';

import { CoinbaseProvider } from '../../../../providers/coinbase/coinbase';

@Component({
  selector: 'page-coinbase-settings',
  templateUrl: 'coinbase-settings.html',
})
export class CoinbaseSettingsPage {

  constructor(
    public viewCtrl: ViewController,
    public coinbaseProvider: CoinbaseProvider,
    public navParams: NavParams
  ) {
  }

}
