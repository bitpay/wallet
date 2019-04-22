import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

// pages
import { ImportWalletPage } from './import-wallet/import-wallet';
import { NewWalletPage } from './new-wallet/new-wallet';
import { SelectCurrencyPage } from './select-currency/select-currency';

// providers
import { Logger } from '../../providers/logger/logger';
import { ProfileProvider } from '../../providers/profile/profile';
@Component({
  selector: 'page-add',
  templateUrl: 'add.html'
})
export class AddPage {
  public hasWallets: boolean;

  constructor(
    private navCtrl: NavController,
    private logger: Logger,
    private profileProvider: ProfileProvider
  ) {
    this.hasWallets = this.profileProvider.getWallets().length > 0;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: AddPage');
  }

  public goToNewWalletPage(addToAccount: boolean): void {
    this.navCtrl.push(NewWalletPage, { addToAccount });
  }

  public goToSelectCurrencyPage(nextPage: string): void {
    this.navCtrl.push(SelectCurrencyPage, { nextPage });
  }

  public goToImportWallet(): void {
    this.navCtrl.push(ImportWalletPage);
  }
}
