import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { CreateWalletPage } from "./create-wallet/create-wallet";
import { ImportWalletPage } from "./import-wallet/import-wallet";
import { JoinWalletPage } from "./join-wallet/join-wallet";

@Component({
  selector: 'page-add',
  templateUrl: 'add.html'
})
export class AddPage {

  private coin: string;

  constructor(
    public navCtrl: NavController,
    private navParams: NavParams
  ) {
    this.coin = this.navParams.data.coin ? this.navParams.data.coin : 'btc';
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad AddPage');
  }

  goToCreateWallet(isShared: boolean) {
    this.navCtrl.push(CreateWalletPage, { isShared: isShared, coin: this.coin });
  }

  goToJoinWallet() {
    this.navCtrl.push(JoinWalletPage, { coin: this.coin });
  }

  goToImportWallet() {
    this.navCtrl.push(ImportWalletPage);
  }
}
