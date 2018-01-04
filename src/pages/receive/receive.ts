import { Component } from '@angular/core';
import { Logger } from '@nsalaun/ng-logger';
import { NavController, Events, AlertController } from 'ionic-angular';

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
import { BwcErrorProvider } from '../../providers/bwc-error/bwc-error';

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
  public loading: boolean;

  constructor(
    private navCtrl: NavController,
    private alertCtrl: AlertController,
    private logger: Logger,
    private profileProvider: ProfileProvider,
    private walletProvider: WalletProvider,
    private platformProvider: PlatformProvider,
    private events: Events,
    private socialSharing: SocialSharing,
    private bwcErrorProvider: BwcErrorProvider
  ) {
    this.showShareButton = this.platformProvider.isCordova;
  }

  ionViewWillEnter() {
    this.wallets = this.profileProvider.getWallets();
    this.onWalletSelect(this.checkSelectedWallet(this.wallet, this.wallets));
    this.events.subscribe('bwsEvent', (walletId, type, n) => {
      // Update current address
      if (this.wallet && walletId == this.wallet.id && type == 'NewIncomingTx') this.setAddress(true);
    });
  }

  ionViewWillLeave() {
    this.events.unsubscribe('bwsEvent');
  }

  private onWalletSelect(wallet: any): any {
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
    this.navCtrl.push(AmountPage, {
      toAddress: this.address,
      walletId: this.wallet.credentials.walletId,
      recipientType: 'wallet',
      name: this.wallet.name,
      color: this.wallet.color,
      coin: this.wallet.coin,
      network: this.wallet.network,
      nextPage: 'CustomAmountPage',
    });
  }

  private setAddress(newAddr?: boolean): void {

    this.loading = newAddr || _.isEmpty(this.address) ? true : false;

    this.walletProvider.getAddress(this.wallet, newAddr).then((addr) => {
      this.loading = false
      this.address = addr;
      this.updateQrAddress();
    }).catch((err) => {
      this.loading = false;
      this.logger.warn(this.bwcErrorProvider.msg(err, 'Server Error'));
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
    this.events.publish('showWalletsSelectorEvent', this.wallets);
    this.events.subscribe('selectWalletEvent', (wallet: any) => {
      this.onWalletSelect(wallet);
      this.events.unsubscribe('selectWalletEvent');
    });
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
