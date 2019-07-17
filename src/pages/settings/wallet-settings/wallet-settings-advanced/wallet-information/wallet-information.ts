import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';
import * as _ from 'lodash';

// providers
import { Logger } from '../../../../../providers/logger/logger';
import { ProfileProvider } from '../../../../../providers/profile/profile';

@Component({
  selector: 'page-wallet-information',
  templateUrl: 'wallet-information.html'
})
export class WalletInformationPage {
  public wallet;
  public walletId: string;
  public walletName: string;
  public N: number;
  public M: number;
  public copayers;
  public copayerId;
  public balanceByAddress;
  public account: number;
  public coin: string;
  public network: string;
  public addressType: string;
  public rootPath: string;
  public pubKeys;
  public externalSource: string;
  public canSign: boolean;

  constructor(
    private profileProvider: ProfileProvider,
    private navParams: NavParams,
    private logger: Logger
  ) {}

  ionViewDidLoad() {
    this.logger.info('Loaded:  WalletInformationPage');
  }

  ionViewWillEnter() {
    this.wallet = this.profileProvider.getWallet(this.navParams.data.walletId);
    this.walletName = this.wallet.name;
    this.coin = this.wallet.coin;
    this.walletId = this.wallet.credentials.walletId;
    this.N = this.wallet.credentials.n;
    this.M = this.wallet.credentials.m;
    if (this.wallet.cachedStatus) {
      this.copayers = this.wallet.cachedStatus.wallet.copayers;
    }
    this.copayerId = this.wallet.credentials.copayerId;
    this.balanceByAddress = this.wallet.balanceByAddress;
    this.account = this.wallet.credentials.account;
    this.network = this.wallet.credentials.network;
    this.addressType = this.wallet.credentials.addressType || 'P2SH';
    this.rootPath = this.wallet.credentials.rootPath;
    this.pubKeys = _.map(this.wallet.credentials.publicKeyRing, 'xPubKey');
    this.externalSource = null;
    this.canSign = this.wallet.canSign;
  }
}
