import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

// pages
import { AddPage } from '../add/add';

// providers
import { Logger } from '../../providers/logger/logger';
import { ImportWalletPage } from '../add/import-wallet/import-wallet';

@Component({
  selector: 'page-add-wallet',
  templateUrl: 'add-wallet.html'
})
export class AddWalletPage {
  constructor(private navCtrl: NavController, private logger: Logger) {}

  ionViewDidLoad() {
    this.logger.info('Loaded: AddWalletPage');
  }

  public goToAddPage(): void {
    this.navCtrl.push(AddPage);
  }

  public goToImportWallet(): void {
    this.navCtrl.push(ImportWalletPage);
  }
}
