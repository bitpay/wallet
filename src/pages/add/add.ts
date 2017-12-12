import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';

//pages
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
    private navCtrl: NavController,
    private navParams: NavParams,
    private logger: Logger
  ) {
    this.coin = this.navParams.data.coin ? this.navParams.data.coin : 'btc';
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad AddPage');
  }

  public goToCreateWallet(isShared: boolean): void {
    this.navCtrl.push(CreateWalletPage, { isShared: isShared, coin: this.coin });
  }

  public goToJoinWallet(): void {
    this.navCtrl.push(JoinWalletPage, { coin: this.coin });
  }

  public goToImportWallet(): void {
    this.navCtrl.push(ImportWalletPage, { coin: this.coin });
  }
}
