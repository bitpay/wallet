import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { AmountPage } from '../send/amount/amount';
import { WalletProvider } from '../../providers/wallet/wallet';
import { ProfileProvider } from '../../providers/profile/profile';

import * as _ from 'lodash';

@Component({
  selector: 'page-receive',
  templateUrl: 'receive.html',
})
export class ReceivePage {

  public protocolHandler: string;
  public address: string;
  public qrAddress: string;
  public wallets: any;
  public wallet: any;

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private profileProvider: ProfileProvider,
    private walletProvider: WalletProvider
  ) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ReceivePage');
  }

  ionViewDidEnter() {
    this.wallets = this.profileProvider.getWallets();
    this.updateQrAddress();
    this.onSelect(this.checkSelectedWallet(this.wallet, this.wallets));
  }

  private onSelect(wallet: any): any {
    this.wallet = wallet;
    if (this.wallet) {
      this.setProtocolHandler();
      this.setAddress();
    }
  }

  private setProtocolHandler(): void {
    this.protocolHandler = this.walletProvider.getProtocolHandler(this.wallet.coin);
  }

  private checkSelectedWallet(wallet: any, wallets: any): any {
    if (!wallet) return wallets[0];
    let w = _.find(wallets, (w: any) => {
      return w.id == wallet.id;
    });
    if (!w) return wallets[0];
    return wallet;
  }

  public requestSpecificAmount(): void {
    this.navCtrl.push(AmountPage, { address: this.address, sending: false });
  }

  private setAddress(newAddr?: boolean): void {
    this.walletProvider.getAddress(this.wallet, newAddr).then((addr) => {
      this.address = addr;
      this.updateQrAddress();
    }).catch((err) => {
      console.log(err);
    });
  }

  private updateQrAddress(): void {
    this.qrAddress = this.protocolHandler + ":" + this.address;
  }

}
