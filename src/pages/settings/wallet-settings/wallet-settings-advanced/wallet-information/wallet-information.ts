import { Component } from '@angular/core';
import { NavController, NavParams, ModalController } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';

//providers
import { ProfileProvider } from '../../../../../providers/profile/profile';
import { ConfigProvider } from '../../../../../providers/config/config';
import { WalletProvider } from '../../../../../providers/wallet/wallet';

//pages
import { HomePage } from '../../../../../pages/home/home';
import { WalletExtendedPrivateKeyPage } from './wallet-extended-private-key/wallet-extended-private-key';

import * as _ from 'lodash';

@Component({
  selector: 'page-wallet-information',
  templateUrl: 'wallet-information.html',
})
export class WalletInformationPage {

  public wallet: any;
  public walletId: string;
  public walletName: string;
  public coin: string;
  public network: string;
  public addressType: string;
  public derivationStrategy: string;
  public basePath: string;
  public pubKeys: Array<string>;
  public externalSource: string;
  public canSign: boolean;
  private config: any;
  private colorCounter = 1;
  private BLACK_WALLET_COLOR = '#202020';

  constructor(
    private profileProvider: ProfileProvider,
    private configProvider: ConfigProvider,
    private walletProvider: WalletProvider,
    private navParams: NavParams,
    private navCtrl: NavController
  ) {

  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad WalletInformationPage');
  }

  ionViewDidEnter() {
    this.wallet = this.profileProvider.getWallet(this.navParams.data.walletId);
    this.config = this.configProvider.get();
    this.walletName = this.wallet.credentials.walletName;
    this.coin = this.wallet.coin;
    this.walletId = this.wallet.credentials.walletId;
    this.network = this.wallet.credentials.network;
    this.addressType = this.wallet.credentials.addressType || 'P2SH';
    this.derivationStrategy = this.wallet.credentials.derivationStrategy || 'BIP45';
    this.basePath = this.wallet.credentials.getBaseAddressDerivationPath();;
    this.pubKeys = _.map(this.wallet.credentials.publicKeyRing, 'xPubKey');
    this.externalSource = null;
    this.canSign = this.wallet.canSign();
  }

  public saveBlack(): void {
    if (this.colorCounter != 5) {
      this.colorCounter++;
      return;
    }
    this.save(this.BLACK_WALLET_COLOR);
  };

  private save(color): void {
    let opts = {
      colorFor: {}
    };
    opts.colorFor[this.wallet.credentials.walletId] = color;
    this.configProvider.set(opts);
    this.navCtrl.setRoot(HomePage);
    this.navCtrl.popToRoot();
  };

  public openWalletExtendedPrivateKey(): void {
    this.navCtrl.push(WalletExtendedPrivateKeyPage, { walletId: this.wallet.credentials.walletId });
  }
}