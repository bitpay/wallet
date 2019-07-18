import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

// pages
import { AddWalletPage } from '../add-wallet/add-wallet';

// providers
import { Logger } from '../../providers/logger/logger';
import { ImportWalletPage } from '../add/import-wallet/import-wallet';

@Component({
  selector: 'page-add',
  templateUrl: 'add.html'
})
export class AddPage {
  constructor(private navCtrl: NavController, private logger: Logger) {}

  ionViewDidLoad() {
    this.logger.info('Loaded: AddPage');
  }

  public goToAddWalletPage(
    isShared: boolean,
    isJoin: boolean,
    isCreate: boolean
  ): void {
    this.navCtrl.push(AddWalletPage, {
      isCreate,
      isJoin,
      isShared
    });
  }

  public goToImportWallet(): void {
    this.navCtrl.push(ImportWalletPage);
  }
}
