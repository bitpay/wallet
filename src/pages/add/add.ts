import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { CreateWalletPage } from "./create-wallet/create-wallet";
import { ImportWalletPage } from "./import-wallet/import-wallet";

@Component({
  selector: 'page-add',
  templateUrl: 'add.html'
})
export class AddPage {
  constructor(public navCtrl: NavController) {}

  ionViewDidLoad() {
    console.log('ionViewDidLoad AddPage');
  }

  goToCreateWallet(isShared: boolean) {
    this.navCtrl.push(CreateWalletPage, {isShared: isShared});
  }

  goToJoinWallet() {
    // this.navCtrl.push();
  }

  goToImportWallet() {
    this.navCtrl.push(ImportWalletPage);
  }
}
