import { Component } from '@angular/core';
import { ActionSheetParent } from '../action-sheet/action-sheet-parent';

@Component({
  selector: 'wallet-selector',
  templateUrl: 'wallet-selector.html'
})
export class WalletSelectorComponent extends ActionSheetParent {
  public wallets;
  public walletsBtc;
  public walletsBch;
  public title: string;
  public selectedWalletId: string;

  constructor() {
    super();
  }

  ngOnInit() {
    this.wallets = this.params.wallets;
    this.title = this.params.title;
    this.selectedWalletId = this.params.selectedWalletId;
    this.separateWallets();
  }

  private separateWallets(): void {
    this.walletsBtc = this.wallets.filter(wallet => wallet.coin === 'btc');
    this.walletsBch = this.wallets.filter(wallet => wallet.coin === 'bch');
  }

  public optionClicked(option): void {
    this.dismiss(option);
  }
}
