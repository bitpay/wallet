import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

// pages
import { JoinWalletPage } from '../add/join-wallet/join-wallet';
import { SelectCurrencyPage } from '../add/select-currency/select-currency';

// providers
import { ConfigProvider } from '../../providers/config/config';
import { Logger } from '../../providers/logger/logger';
import { ProfileProvider } from '../../providers/profile/profile';

import * as _ from 'lodash';

@Component({
  selector: 'page-add-wallet',
  templateUrl: 'add-wallet.html'
})
export class AddWalletPage {
  public walletsGroups;
  public allowMultiplePrimaryWallets: boolean;

  constructor(
    private navCtrl: NavController,
    private logger: Logger,
    private profileProvider: ProfileProvider,
    private navParams: NavParams,
    private configProvider: ConfigProvider
  ) {
    const config = this.configProvider.get();

    const opts = {
      canAddNewAccount: true,
      showHidden: true
    };
    const wallets = this.profileProvider.getWallets(opts);
    this.walletsGroups = _.values(_.groupBy(wallets, 'keyId'));

    const opts2 = {
      showHidden: true
    };
    const wallets2 = this.profileProvider.getWallets(opts2);
    const nrKeys = _.values(_.groupBy(wallets2, 'keyId')).length;
    this.allowMultiplePrimaryWallets =
      config.allowMultiplePrimaryWallets || nrKeys != 1;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: AddWalletPage');
  }

  public goToAddPage(keyId): void {
    if (this.navParams.data.isCreate) {
      this.navCtrl.push(SelectCurrencyPage, {
        isShared: this.navParams.data.isShared,
        keyId
      });
    } else if (this.navParams.data.isJoin) {
      this.navCtrl.push(JoinWalletPage, {
        keyId,
        url: this.navParams.data.url
      });
    }
  }
}
