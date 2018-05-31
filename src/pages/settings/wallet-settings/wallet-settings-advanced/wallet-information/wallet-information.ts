import { Component } from '@angular/core';
import { App, Events, NavController, NavParams } from 'ionic-angular';
import { Logger } from '../../../../../providers/logger/logger';

// providers
import { ConfigProvider } from '../../../../../providers/config/config';
import { ProfileProvider } from '../../../../../providers/profile/profile';

// pages
import { WalletExtendedPrivateKeyPage } from './wallet-extended-private-key/wallet-extended-private-key';

import * as _ from 'lodash';
import { TabsPage } from '../../../../tabs/tabs';

@Component({
  selector: 'page-wallet-information',
  templateUrl: 'wallet-information.html'
})
export class WalletInformationPage {
  public wallet: any;
  public walletId: string;
  public walletName: string;
  public N: number;
  public M: number;
  public copayers: any;
  public copayerId: any;
  public balanceByAddress: any;
  public account: number;
  public coin: string;
  public network: string;
  public addressType: string;
  public derivationStrategy: string;
  public basePath: string;
  public pubKeys: any[];
  public externalSource: string;
  public canSign: boolean;
  public needsBackup: boolean;
  private colorCounter = 1;
  private BLACK_WALLET_COLOR = '#202020';

  constructor(
    private app: App,
    private profileProvider: ProfileProvider,
    private configProvider: ConfigProvider,
    private navParams: NavParams,
    private navCtrl: NavController,
    private events: Events,
    private logger: Logger
  ) {}

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad WalletInformationPage');
  }

  ionViewWillEnter() {
    this.wallet = this.profileProvider.getWallet(this.navParams.data.walletId);
    this.walletName = this.wallet.name;
    this.coin = this.wallet.coin;
    this.walletId = this.wallet.credentials.walletId;
    this.N = this.wallet.credentials.n;
    this.M = this.wallet.credentials.m;
    this.copayers = this.wallet.cachedStatus.wallet.copayers;
    this.copayerId = this.wallet.credentials.copayerId;
    this.balanceByAddress = this.wallet.balanceByAddress;
    this.account = this.wallet.credentials.account;
    this.network = this.wallet.credentials.network;
    this.addressType = this.wallet.credentials.addressType || 'P2SH';
    this.derivationStrategy =
      this.wallet.credentials.derivationStrategy || 'BIP45';
    this.basePath = this.wallet.credentials.getBaseAddressDerivationPath();
    this.pubKeys = _.map(this.wallet.credentials.publicKeyRing, 'xPubKey');
    this.externalSource = null;
    this.canSign = this.wallet.canSign();
    this.needsBackup = this.wallet.needsBackup;
  }

  public saveBlack(): void {
    if (this.colorCounter != 5) {
      this.colorCounter++;
      return;
    }
    this.save(this.BLACK_WALLET_COLOR);
  }

  private save(color): void {
    let opts = {
      colorFor: {}
    };
    opts.colorFor[this.wallet.credentials.walletId] = color;
    this.configProvider.set(opts);
    this.events.publish('wallet:updated', this.wallet.credentials.walletId);
    this.app.getRootNavs()[0].setRoot(TabsPage);
  }

  public openWalletExtendedPrivateKey(): void {
    this.navCtrl.push(WalletExtendedPrivateKeyPage, {
      walletId: this.wallet.credentials.walletId
    });
  }
}
