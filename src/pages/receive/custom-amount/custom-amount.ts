import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';

// Native
import { SocialSharing } from '@ionic-native/social-sharing';

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
    private logger: Logger,
    private socialSharing: SocialSharing
  ) {
    this.amount = this.navParams.data.amount;
    this.coin = this.navParams.data.coin;
    let walletId = this.navParams.data.walletId;
    this.wallet = this.profileProvider.getWallet(walletId);
    this.showShareButton = this.platformProvider.isCordova;

    let addr = this.navParams.data.toAddress;
    this.address = this.walletProvider.getAddressView(this.wallet, addr);
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad CustomAmountPage');
    this.updateQrAddress();
  }

  private updateQrAddress(): void {
    this.qrAddress = this.walletProvider.getProtoAddress(this.wallet, this.address) + "?amount=" + this.amount;
  }

  public shareAddress(): void {
    this.socialSharing.share(this.qrAddress);
  }

}
