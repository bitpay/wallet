import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
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

  public close() {
    this.getParentTabs().dismiss();
  }

  public getParentTabs() {
    return this.navCtrl.parent.viewCtrl;
  }

  public getParentWallet() {
    const walletId = this.getParentTabs().instance.walletId;
    const wallets = this.profileProvider.getWallets();
    return wallets.filter(w => w.id === walletId)[0];
  }
}
