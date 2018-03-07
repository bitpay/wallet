import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';

//providers
import { WalletProvider } from '../../providers/wallet/wallet';

@Component({
  selector: 'page-payrpo',
  templateUrl: 'paypro.html',
})
export class PayProPage {

  public tx: any;
  public wallet: any;

  constructor(
    private navParams: NavParams,
    private viewCtrl: ViewController,
    private walletProvider: WalletProvider,
  ) {
    this.tx = this.navParams.data.tx;
    this.wallet = this.navParams.data.wallet;
    this.tx.paypro.toAddress = this.walletProvider.getAddressView(this.wallet, this.tx.paypro.toAddress);
  }

  close() {
    this.viewCtrl.dismiss();
  }
}