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
  ) {
    const config = this.configProvider.get();
    const opts2 = {
      showHidden: true
    };
 
    const wallets2 = this.profileProvider.getWallets(opts2);
    const nrKeys = _.values(_.groupBy(wallets2, 'keyId')).length;
    this.allowMultiplePrimaryWallets = config.allowMultiplePrimaryWallets || nrKeys != 1;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: AddPage');
  }

  public goToAddWalletPage(
    isShared: boolean,
    isJoin: boolean,
    isCreate: boolean
  ): void {
    const opts = {
      canAddNewAccount: true
    };
    const wallets = this.profileProvider.getWallets(opts);
    const walletsGroups = _.values(_.groupBy(wallets, 'keyId'));

    if (walletsGroups.length === 0) {
      this.goToNextPage(isCreate, isJoin, isShared);
    } else if (
      (this.allowMultiplePrimaryWallets && walletsGroups.length >= 1) ||
      (!this.allowMultiplePrimaryWallets && walletsGroups.length > 1)
    ) {
      this.navCtrl.push(AddWalletPage, {
        isCreate,
        isJoin,
        isShared
      });
    } else if (
      !this.allowMultiplePrimaryWallets &&
      walletsGroups.length === 1
    ) {
      this.goToNextPageWithKeyId(isCreate, isJoin, isShared, walletsGroups[0]);
    }
  }

  private goToNextPage(isCreate, isJoin, isShared) {
    if (isCreate) {
      this.navCtrl.push(SelectCurrencyPage, {
        isShared
      });
    } else if (isJoin) {
      this.navCtrl.push(JoinWalletPage);
    }
  }

  private goToNextPageWithKeyId(isCreate, isJoin, isShared, walletGroup) {
    if (isCreate) {
      this.navCtrl.push(SelectCurrencyPage, {
        isShared,
        keyId: walletGroup[0].credentials.keyId
      });
    } else if (isJoin) {
      this.navCtrl.push(JoinWalletPage, {
        keyId: walletGroup[0].credentials.keyId
      });
    }
  }

  public goToImportWallet(): void {
    this.navCtrl.push(ImportWalletPage);
  }
}
