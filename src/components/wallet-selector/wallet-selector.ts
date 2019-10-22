import { Component } from '@angular/core';
import {
  Coin,
  CoinsMap,
  CurrencyProvider
} from '../../providers/currency/currency';
import { ActionSheetParent } from '../action-sheet/action-sheet-parent';
@Component({
  selector: 'wallet-selector',
  templateUrl: 'wallet-selector.html'
})
export class WalletSelectorComponent extends ActionSheetParent {
  public wallets = {} as CoinsMap<any>;
  public availableCoins: Coin[];
  public title: string;
  public selectedWalletId: string;
  constructor(private currencyProvider: CurrencyProvider) {
    super();
    this.availableCoins = this.currencyProvider.getAvailableCoins();
  }

  ngOnInit() {
    this.title = this.params.title;
    this.selectedWalletId = this.params.selectedWalletId;
    this.separateWallets();
  }

  public getCoinName(coin: Coin) {
    return this.currencyProvider.getCoinName(coin);
  }

  private separateWallets(): void {
    const wallets = this.params.wallets;
    for (const coin of this.availableCoins) {
      this.wallets[coin] = wallets.filter(wallet => wallet.coin === coin);
    }
  }

  public optionClicked(option): void {
    this.dismiss(option);
  }
}
