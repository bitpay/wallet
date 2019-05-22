import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController, NavParams } from 'ionic-angular';

// pages
import { JoinWalletPage } from '../join-wallet/join-wallet';
import { SelectCurrencyPage } from '../select-currency/select-currency';

// services
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { Logger } from '../../../providers/logger/logger';
import { ProfileProvider } from '../../../providers/profile/profile';

import * as _ from 'lodash';
@Component({
  selector: 'page-new-wallet',
  templateUrl: 'new-wallet.html'
})
export class NewWalletPage {
  addToAccount: boolean;
  isOpenSelector: boolean;
  walletGroups;
  selectedWalletGroup;
  title: string;

  constructor(
    private navCtrl: NavController,
    private logger: Logger,
    private navParams: NavParams,
    private profileProvider: ProfileProvider,
    private actionSheetProvider: ActionSheetProvider,
    private translate: TranslateService
  ) {
    this.addToAccount = this.navParams.data.addToAccount;
    if (this.addToAccount) {
      this.profileProvider.getAllWalletsGroups().then(walletGroups => {
        this.walletGroups = _.compact(walletGroups);
        this.selectedWalletGroup = this.walletGroups[0];
      });
    }
    this.title = this.addToAccount
      ? this.translate.instant('Add to Wallet')
      : this.translate.instant('Create New Wallet');
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: NewWalletPage');
  }

  public goToSelectCurrencyPage(isShared: boolean, nextPage: string): void {
    const walletGroupId =
      this.selectedWalletGroup && this.selectedWalletGroup.id;
    this.navCtrl.push(SelectCurrencyPage, {
      isShared,
      nextPage,
      walletGroupId
    });
  }

  public goToJoinWallet(): void {
    const walletGroupId =
      this.selectedWalletGroup && this.selectedWalletGroup.id;
    this.navCtrl.push(JoinWalletPage, {
      walletGroupId
    });
  }

  public showWalletsGroups(): void {
    this.isOpenSelector = true;
    const params = {
      walletGroups: this.walletGroups,
      selectedWalletGroupId: this.selectedWalletGroup.id
    };
    const walletSelector = this.actionSheetProvider.createWalletGroupSelector(
      params
    );
    walletSelector.present();
    walletSelector.onDidDismiss(walletGroup => {
      if (walletGroup) this.selectedWalletGroup = walletGroup;
      this.isOpenSelector = false;
    });
  }
}
