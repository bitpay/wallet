import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';

// pages
import { PersistenceProvider } from '../../providers/persistence/persistence';
import { CreateVaultPage } from './create-vault/create-vault';
import { CreateWalletPage } from './create-wallet/create-wallet';
import { ImportWalletPage } from './import-wallet/import-wallet';
import { JoinWalletPage } from './join-wallet/join-wallet';
@Component({
  selector: 'page-add',
  templateUrl: 'add.html'
})
export class AddPage {
  public noVault: boolean;
  constructor(
    private navCtrl: NavController,
    private logger: Logger,
    private persistenceProvider: PersistenceProvider
  ) {
    this.persistenceProvider.getVaults().then(vaults => {
      this.noVault = !vaults;
    });
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: AddPage');
  }

  public goToCreateWallet(isShared: boolean): void {
    this.navCtrl.push(CreateWalletPage, { isShared });
  }

  public goToJoinWallet(): void {
    this.navCtrl.push(JoinWalletPage);
  }

  public goToImportWallet(): void {
    this.navCtrl.push(ImportWalletPage);
  }

  public goToCreateVaultView(): void {
    this.navCtrl.push(CreateVaultPage);
  }
}
