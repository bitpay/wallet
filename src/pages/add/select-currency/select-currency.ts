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

  constructor(
    private navCtrl: NavController,
    private logger: Logger,
    private navParam: NavParams
  ) {
    this.isShared = this.navParam.data.isShared;
    this.nextPage = this.navParam.data.nextPage;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: SelectCurrencyPage');
  }

  public goToNextPage(coin): void {
    if (this.nextPage == 'create') this.goToCreateWallet(coin);
    if (this.nextPage == 'import') this.goToImportWallet(coin);
  }

  public goToCreateWallet(coin): void {
    this.navCtrl.push(CreateWalletPage, { isShared: this.isShared, coin });
  }

  public goToImportWallet(coin): void {
    this.navCtrl.push(ImportWalletPage, { coin });
  }
}
