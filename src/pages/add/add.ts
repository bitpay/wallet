import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

// pages
import { AddWalletPage } from '../add-wallet/add-wallet';
import { ImportWalletPage } from '../add/import-wallet/import-wallet';
import { SelectCurrencyPage } from '../add/select-currency/select-currency';

// providers
import { Logger } from '../../providers';

@Component({
  selector: 'page-add',
  templateUrl: 'add.html'
})
export class AddPage {
  public keyId: string;
  public isZeroState: boolean;

  constructor(
    private navCtrl: NavController,
    private logger: Logger,
    private navParams: NavParams
  ) {}

  ionViewDidLoad() {
    this.logger.info('Loaded: AddPage');
    this.keyId = this.navParams.data.keyId;
    this.isZeroState = this.navParams.data.isZeroState;
  }

  public goToAddWalletPage(isShared?: boolean, isJoin?: boolean): void {
    if (this.navParams.data.isMultipleSeed) {
      this.navCtrl.push(AddWalletPage, {
        isCreate: true,
        isMultipleSeed: true,
        isShared,
        url: this.navParams.data.url
      });
    } else {
      this.navCtrl.push(SelectCurrencyPage, {
        isShared,
        isJoin,
        isZeroState: this.isZeroState && !isShared,
        keyId: this.keyId,
        url: this.navParams.data.url
      });
    }
  }

  public goToImportWallet(): void {
    this.navCtrl.push(ImportWalletPage);
  }

  public goBack(): void {
    this.navCtrl.pop();
  }
}
