import { Component, Input } from '@angular/core';

@Component({
  selector: 'page-wallet-item',
  templateUrl: 'wallet-item.html'
})
export class WalletItemPage {
  private _wallet: any;

  @Input()
  set wallet(wallet: any) {
    this._wallet = wallet;
  }

  get wallet() {
    return this._wallet;
  }
}
