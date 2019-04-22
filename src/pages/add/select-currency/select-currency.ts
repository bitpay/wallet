import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';

// pages
import { CreateWalletPage } from '../create-wallet/create-wallet';
import { ImportWalletPage } from '../import-wallet/import-wallet';

@Component({
  selector: 'page-select-currency',
  templateUrl: 'select-currency.html'
})
export class SelectCurrencyPage {
  public coin: string;
  private isShared: boolean;
  private nextPage: string;
  private walletGroupId: string;

  constructor(
    private navCtrl: NavController,
    private logger: Logger,
    private navParams: NavParams
  ) {
    this.isShared = this.navParams.data.isShared;
    this.nextPage = this.navParams.data.nextPage;
    this.walletGroupId = this.navParams.data.walletGroupId;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: SelectCurrencyPage');
  }

  public goToNextPage(coin): void {
    if (this.nextPage == 'create') this.goToCreateWallet(coin);
    if (this.nextPage == 'join') this.goToJoinWallet(coin);
  }

  public goToCreateWallet(coin): void {
    this.navCtrl.push(CreateWalletPage, {
      walletGroupId: this.walletGroupId,
      isShared: this.isShared,
      coin
    });
  }

  public goToJoinWallet(coin): void {
    this.navCtrl.push(ImportWalletPage, {
      coin,
      walletGroupId: this.walletGroupId
    });
  }
}
