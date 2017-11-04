import { Component } from '@angular/core';
import { NavController, Events, ActionSheetController} from 'ionic-angular';

//native
import { SocialSharing } from '@ionic-native/social-sharing';

//pages
import { AmountPage } from '../send/amount/amount';
import { CopayersPage } from '../copayers/copayers';
//providers
import { WalletProvider } from '../../providers/wallet/wallet';
import { ProfileProvider } from '../../providers/profile/profile';
import { PopupProvider } from '../../providers/popup/popup';
import { PlatformProvider } from '../../providers/platform/platform';

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
  public showShareButton: boolean;

  constructor(
    private navCtrl: NavController,
    private profileProvider: ProfileProvider,
    private walletProvider: WalletProvider,
    private popupProvider: PopupProvider,
    private platformProvider: PlatformProvider,
    private events: Events,
    private actionSheetCtrl: ActionSheetController,
    private socialSharing: SocialSharing
  ) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ReceivePage');
  }

  ionViewDidEnter() {
    this.wallets = this.profileProvider.getWallets();
    this.updateQrAddress();
    this.onSelect(this.checkSelectedWallet(this.wallet, this.wallets));
    this.showShareButton = this.platformProvider.isCordova;
    this.events.subscribe('bwsEvent', (e, walletId, type, n) => {
      // Update current address
      if (this.wallet && walletId == this.wallet.id && type == 'NewIncomingTx') this.setAddress(true);
    });
  }

  ionViewWillLeave() {
    this.events.unsubscribe('bwsEvent');
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
      if (err) {
        this.popupProvider.ionicAlert(err);
      }
    });
  }

  private updateQrAddress(): void {
    this.qrAddress = this.protocolHandler + ":" + this.address;
  }

  public shareAddress(): void {
    let protocol = 'bitcoin';
    if (this.wallet.coin == 'bch') protocol += 'cash';
    this.socialSharing.share(protocol + ':' + this.address);
  }

  public showWallets(): void {
    let buttons: Array<any> = [];
    let coinClass: string = "wallets";

    this.wallets.forEach((wallet, index) => {

      let walletButton: Object = {
        text: wallet.credentials.walletName,
        cssClass: coinClass,
        handler: () => {
          this.onSelect(wallet);
        }
      }
      buttons.push(walletButton);
    });

    const actionSheet = this.actionSheetCtrl.create({
      title: 'Select a wallet',
      buttons: buttons
    });

    actionSheet.present();
  }

  public goCopayers(): void {
    this.navCtrl.push(CopayersPage, { walletId: this.wallet.credentials.walletId });
  };

  public openBackupNeededModal(): void {
    // TODO

  }

}
