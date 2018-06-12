import { Component } from '@angular/core';
import { NavController, ViewController } from 'ionic-angular';
import { ProfileProvider } from '../../providers/profile/profile';

@Component({
  template: ''
})
export class WalletTabsChild {
  wallets;
  wallet;

  constructor(
    public navCtrl: NavController,
    public profileProvider: ProfileProvider
  ) {}

  ngOnInit() {
    this.wallets = this.profileProvider.getWallets();
    this.wallet = this.getParentWallet();
  }

  public close(): Promise<void> {
    return this.getParentTabs().dismiss();
  }

  public getParentTabs(): ViewController {
    return this.navCtrl.parent.viewCtrl;
  }

  public getParentWallet() {
    const walletId = this.getParentTabs().instance.walletId;
    return this.profileProvider.getWallet(walletId);
  }
}
