import { Component } from '@angular/core';
import * as _ from 'lodash';
import { ActionSheetParent } from '../action-sheet/action-sheet-parent';

@Component({
  selector: 'wallet-selector',
  templateUrl: 'wallet-selector.html'
})
export class WalletSelectorComponent extends ActionSheetParent {
  public walletsByKeys: any[];
  public title: string;
  public selectedWalletId: string;
  public coinbaseData;

  constructor() {
    super();
  }

  ngOnInit() {
    this.title = this.params.title;
    this.selectedWalletId = this.params.selectedWalletId;
    this.coinbaseData = this.params.coinbaseData;
    this.separateWallets();
  }

  private separateWallets(): void {
    const wallets = this.params.wallets;
    this.walletsByKeys = _.values(_.groupBy(wallets, 'keyId'));
  }

  public optionClicked(option, isCoinbaseAccount?: boolean): void {
    if (!isCoinbaseAccount) this.dismiss(option);
    else {
      const optionClicked = {
        accountSelected: _.find(
          this.coinbaseData.availableAccounts,
          ac => ac.id == option
        ),
        isCoinbaseAccount
      };
      this.dismiss(optionClicked);
    }
  }
}
