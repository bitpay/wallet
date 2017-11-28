import { Component } from '@angular/core';
import { Logger } from '@nsalaun/ng-logger';
import { NavController, Events, ActionSheetController, AlertController } from 'ionic-angular';

//native
import { SocialSharing } from '@ionic-native/social-sharing';

//pages
import { AmountPage } from '../send/amount/amount';
import { CopayersPage } from './../add/copayers/copayers';
import { BackupGamePage } from '../backup/backup-game/backup-game';

//providers
import { WalletProvider } from '../../providers/wallet/wallet';
import { ProfileProvider } from '../../providers/profile/profile';
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
  public wallets: Array<any> = [];
  public wallet: any;
  public showShareButton: boolean;

  constructor(
    private navCtrl: NavController,
    private alertCtrl: AlertController,
    private logger: Logger,
    private profileProvider: ProfileProvider,
    private walletProvider: WalletProvider,
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
    this.events.subscribe('bwsEvent', (walletId, type, n) => {
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
    this.navCtrl.push(AmountPage, { toAddress: this.address, fromSend: false, walletId: this.wallet.id });
  }

  private setAddress(newAddr?: boolean): void {

    this.walletProvider.getAddress(this.wallet, newAddr).then((addr) => {
      this.address = addr;
      this.updateQrAddress();
    }).catch((err) => {
      this.logger.warn('Wallet not completed');
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

    _.each(this.wallets, (w: any) => {
      let walletButton: Object = {
        text: w.credentials.walletName,
        cssClass: 'wallet-' + w.network,
        icon: 'wallet',
        handler: () => {
          this.onSelect(w);
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

  public goToBackup(): void {
    let opts = {
      title: 'Screenshots are not secure',
      message: 'If you take a screenshot, your backup may be viewed by other apps. You can make a safe backup with physical paper and a pen',
      buttons: [{
        text: 'I understand',
        handler: () => {
          this.navCtrl.push(BackupGamePage, { walletId: this.wallet.credentials.walletId });
        }
      }],
    }
    this.alertCtrl.create(opts).present();
  }

}
