import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';

//providers
import { ProfileProvider } from '../../../providers/profile/profile';
import { PlatformProvider } from '../../../providers/platform/platform';
import { WalletProvider } from '../../../providers/wallet/wallet';

@Component({
  selector: 'page-custom-amount',
  templateUrl: 'custom-amount.html',
})
export class CustomAmountPage {

  public protocolHandler: string;
  public address: string;
  public amount: string;
  public coin: string;
  public qrAddress: string;
  public wallet: any;
  public showShareButton: boolean;

  constructor(
    private navParams: NavParams,
    private profileProvider: ProfileProvider,
    private platformProvider: PlatformProvider,
    private walletProvider: WalletProvider,
    private logger: Logger
  ) {
    this.address = this.navParams.data.toAddress;
    this.amount = this.navParams.data.amount;
    this.coin = this.navParams.data.coin;
    let walletId = this.navParams.data.walletId;
    this.wallet = this.profileProvider.getWallet(walletId);
    this.showShareButton = this.platformProvider.isCordova;
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad CustomAmountPage');
    this.updateQrAddress();
  }

  private updateQrAddress(): void {
    this.setProtocolHandler();
    this.qrAddress = this.protocolHandler + ":" + this.address + "?amount=" + this.amount;
  }

  private setProtocolHandler(): void {
    this.protocolHandler = this.walletProvider.getProtocolHandler(this.wallet.coin);
  }

  public shareAddress = function () {
    //window.plugins.socialsharing.share(this.qrAddress, null, null, null); TODO
  }

}
