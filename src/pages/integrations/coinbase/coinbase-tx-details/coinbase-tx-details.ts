import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';

//providers
import { CoinbaseProvider } from '../../../../providers/coinbase/coinbase';
import { PopupProvider } from '../../../../providers/popup/popup';

@Component({
  selector: 'page-coinbase-tx-details',
  templateUrl: 'coinbase-tx-details.html',
})
export class CoinbaseTxDetailsPage {

  public updateRequired: boolean;
  public tx: any;

  constructor(
    public viewCtrl: ViewController,
    public coinbaseProvider: CoinbaseProvider,
    public popupProvider: PopupProvider,
    public navParams: NavParams
  ) {
    this.tx = this.navParams.data.tx;
  }

  public remove() {
    this.coinbaseProvider.setCredentials();
    this.updateRequired = false;
    var message = 'Are you sure you want to remove this transaction?';
    this.popupProvider.ionicConfirm(null, message, null, null).then((ok: boolean) => {
      if (!ok) {
        return;
      }
      this.coinbaseProvider.savePendingTransaction(this.tx, {
        remove: true
      }, (err: any) => {
        this.updateRequired = true;
        this.close();
      });
    });
  };

  public close() {
    this.viewCtrl.dismiss({ updateRequired: this.updateRequired });
  }

}
