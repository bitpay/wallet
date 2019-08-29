import { Component } from '@angular/core';
import { NavController, ViewController } from 'ionic-angular';
import { ProfileProvider } from '../../providers/profile/profile';
import { WalletTabsPage } from './wallet-tabs';
import { WalletTabsProvider } from './wallet-tabs.provider';

@Component({ template: '' })
export class WalletTabsChild {
  wallets;
  wallet;
  token?;

  constructor(
    public navCtrl: NavController,
    public profileProvider: ProfileProvider,
    public walletTabsProvider: WalletTabsProvider
  ) {}

  ngOnInit() {
    this.wallets = this.profileProvider.getWallets();
    this.wallet = this.getParentWallet();
    this.token = this.getToken();
  }

  public close(): Promise<any> {
    return this.getParentTabs().dismiss();
  }

  public getParentTabs(): ViewController {
    const navParent = this.navCtrl.parent;
    return navParent && navParent.viewCtrl;
  }

  public getParentWallet() {
    const tabs = this.getParentTabs();
    const wallet = tabs && tabs.instance && tabs.instance.wallet;
    return wallet;
  }

  private getToken() {
    const tabs = this.getParentTabs();
    const token = tabs && tabs.instance && tabs.instance.token;
    return token;
  }

  public isWithinWalletTabs(): boolean {
    const tabs = this.getParentTabs();
    const tabsInstance = tabs && (tabs.instance as WalletTabsPage);
    return tabsInstance && tabsInstance.walletTabs ? true : false;
  }
}
