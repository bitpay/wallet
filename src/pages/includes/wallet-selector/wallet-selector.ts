import { Component } from '@angular/core';
import { Events } from 'ionic-angular';

@Component({
  selector: 'wallet-selector',
  templateUrl: 'wallet-selector.html',
})
export class WalletSelectorPage {

  public showWalletsSelector: boolean;
  public wallets: Array<any>;
  public walletsBtc: Array<any>;
  public walletsBch: Array<any>;
  public showSlideEffect: boolean;
  public title: string;
  public selectedWalletId: string;

  constructor(
    private events: Events
  ) {
    this.showWalletsSelector = false;
    this.showSlideEffect = false;
    this.wallets = [];
    this.events.subscribe('showWalletsSelectorEvent', (wallets: Array<any>, selectedWalletId: string, title?: string) => {
      this.title = title ? title : null;
      this.showWalletsSelector = true;
      this.selectedWalletId = selectedWalletId;
      setTimeout(() => {
        this.showSlideEffect = true;
      }, 50);
      this.wallets = wallets;
      this.separeWallets();
    });
  }

  public selectWallet(wallet: any): void {
    this.events.publish('selectWalletEvent', wallet);
    this.showSlideEffect = false;
    setTimeout(() => {
      this.showWalletsSelector = false;
    }, 150);
  }

  private separeWallets(): void {
    this.walletsBtc = [];
    this.walletsBch = [];
    if (this.wallets.length == 0) return;
    for (var i = 0; i <= this.wallets.length; i++) {
      if (this.wallets[i]) {
        if (this.wallets[i].coin == 'btc') this.walletsBtc.push(this.wallets[i]);
        else this.walletsBch.push(this.wallets[i]);
      }
    }
  }

  public backdropDismiss() {
    this.showSlideEffect = false;
    setTimeout(() => {
      this.showWalletsSelector = false;
    }, 150);
  }

}
