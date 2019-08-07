import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import * as _ from 'lodash';

// pages
import { AddWalletPage } from '../add-wallet/add-wallet';
import { ImportWalletPage } from '../add/import-wallet/import-wallet';
import { JoinWalletPage } from '../add/join-wallet/join-wallet';
import { SelectCurrencyPage } from '../add/select-currency/select-currency';

// providers
import { ConfigProvider, Logger, ProfileProvider } from '../../providers';

@Component({
  selector: 'page-add',
  templateUrl: 'add.html'
})
export class AddPage {
  public allowMultiplePrimaryWallets: boolean;

  constructor(
    private navCtrl: NavController,
    private logger: Logger,
    private configProvider: ConfigProvider,
    private profileProvider: ProfileProvider
  ) {}

  ionViewDidLoad() {
    this.logger.info('Loaded: AddPage');
  }

  public goToAddWalletPage(
    isShared: boolean,
    isJoin: boolean,
    isCreate: boolean
  ): void {
    const config = this.configProvider.get();
    const opts = {
      showHidden: true,
      canAddNewAccount: true
    };

    const wallets = this.profileProvider.getWallets(opts);
    const nrKeys = _.values(_.groupBy(wallets, 'keyId')).length;
    this.allowMultiplePrimaryWallets =
      config.allowMultiplePrimaryWallets || nrKeys != 1;

    if (nrKeys === 0) {
      this.goToNextPage(isCreate, isJoin, isShared);
    } else if (this.allowMultiplePrimaryWallets) {
      this.navCtrl.push(AddWalletPage, {
        isCreate,
        isJoin,
        isShared
      });
    } else if (!this.allowMultiplePrimaryWallets) {
      this.goToNextPage(isCreate, isJoin, isShared, wallets[0].keyId);
    }
  }

  private goToNextPage(isCreate, isJoin, isShared, keyId?) {
    if (isCreate) {
      this.navCtrl.push(SelectCurrencyPage, {
        isShared,
        keyId
      });
    } else if (isJoin) {
      this.navCtrl.push(JoinWalletPage, {
        keyId
      });
    }
  }

  public goToImportWallet(): void {
    this.navCtrl.push(ImportWalletPage);
  }
}
