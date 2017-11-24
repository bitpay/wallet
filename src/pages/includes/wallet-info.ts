import { Component, Input } from "@angular/core";

@Component({
  selector: 'page-wallet-info',
  templateUrl: 'wallet-info.html',
})
export class WalletInfoPage {
  public _wallet: any;

  @Input()
  set wallet(wallet: any) {
    this._wallet = wallet;
  }

  get wallet() {
    return this._wallet;
  }
}