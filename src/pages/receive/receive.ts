import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ActionSheetController, Events, NavController } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';

// Native
import { SocialSharing } from '@ionic-native/social-sharing';

// Pages
import { BackupWarningPage } from '../backup/backup-warning/backup-warning';
import { AmountPage } from '../send/amount/amount';
import { CopayersPage } from './../add/copayers/copayers';

// Providers
import { AddressProvider } from '../../providers/address/address';
import { BwcErrorProvider } from '../../providers/bwc-error/bwc-error';
import { ExternalLinkProvider } from '../../providers/external-link/external-link';
import { PlatformProvider } from '../../providers/platform/platform';
import { ProfileProvider } from '../../providers/profile/profile';
import { WalletProvider } from '../../providers/wallet/wallet';

import * as _ from 'lodash';
import { PopupProvider } from '../../providers/popup/popup';

@Component({
  selector: 'page-receive',
  templateUrl: 'receive.html'
})
export class ReceivePage {
  public protocolHandler: string;
  public address: string;
  public qrAddress: string;
  public wallets = [];
  public wallet;
  public showShareButton: boolean;
  public loading: boolean;
  public isOpenSelector: boolean;

  constructor(
    private actionSheetCtrl: ActionSheetController,
    private navCtrl: NavController,
    private logger: Logger,
    private profileProvider: ProfileProvider,
    private walletProvider: WalletProvider,
    private platformProvider: PlatformProvider,
    private events: Events,
    private socialSharing: SocialSharing,
    private bwcErrorProvider: BwcErrorProvider,
    private translate: TranslateService,
    private externalLinkProvider: ExternalLinkProvider,
    private addressProvider: AddressProvider,
    private popupProvider: PopupProvider
  ) {
    this.showShareButton = this.platformProvider.isCordova;
  }

  ionViewWillEnter() {
    this.isOpenSelector = false;
    this.wallets = this.profileProvider.getWallets();
    this.onWalletSelect(this.checkSelectedWallet(this.wallet, this.wallets));
    this.events.subscribe('bwsEvent', (walletId, type) => {
      // Update current address
      if (this.wallet && walletId == this.wallet.id && type == 'NewIncomingTx')
        this.setAddress(true);
    });
  }

  ionViewWillLeave() {
    this.events.unsubscribe('bwsEvent');
  }

  private onWalletSelect(wallet) {
    this.wallet = wallet;
    if (this.wallet) {
      this.setAddress(false, true);
    }
  }

  private checkSelectedWallet(wallet, wallets) {
    if (!wallet) return wallets[0];
    let w = _.find(wallets, w => {
      return w.id == wallet.id;
    });
    if (!w) return wallets[0];
    return wallet;
  }

  public requestSpecificAmount(): void {
    this.navCtrl.push(AmountPage, {
      toAddress: this.address,
      id: this.wallet.credentials.walletId,
      recipientType: 'wallet',
      name: this.wallet.name,
      color: this.wallet.color,
      coin: this.wallet.coin,
      nextPage: 'CustomAmountPage',
      network: this.addressProvider.validateAddress(this.address).network
    });
  }

  private setAddress(newAddr?: boolean, changingWallet?: boolean): void {
    this.loading =
      newAddr || _.isEmpty(this.address) || changingWallet ? true : false;

    this.walletProvider
      .getAddress(this.wallet, newAddr)
      .then(addr => {
        this.loading = false;
        this.address = this.walletProvider.getAddressView(this.wallet, addr);
        this.updateQrAddress();
      })
      .catch(err => {
        this.loading = false;
        this.logger.warn(this.bwcErrorProvider.msg(err, 'Server Error'));
      });
  }

  private updateQrAddress(): void {
    this.qrAddress = this.walletProvider.getProtoAddress(
      this.wallet,
      this.address
    );
  }

  public shareAddress(): void {
    if (!this.showShareButton) return;
    this.socialSharing.share(this.address);
  }

  public showWallets(): void {
    this.isOpenSelector = true;
    let id = this.wallet ? this.wallet.credentials.walletId : null;
    this.events.publish('showWalletsSelectorEvent', this.wallets, id);
    this.events.subscribe('selectWalletEvent', wallet => {
      if (!_.isEmpty(wallet)) this.onWalletSelect(wallet);
      this.events.unsubscribe('selectWalletEvent');
      this.isOpenSelector = false;
    });
  }

  public goCopayers(): void {
    this.navCtrl.push(CopayersPage, {
      walletId: this.wallet.credentials.walletId
    });
  }

  public goToBackup(): void {
    const backupWarningModal = this.popupProvider.createMiniModal(
      'backup-needed'
    );
    backupWarningModal.present({
      animate: false
    });
    backupWarningModal.onDidDismiss(goToBackupPage => {
      if (goToBackupPage)
        this.navCtrl.push(BackupWarningPage, {
          walletId: this.wallet.credentials.walletId
        });
    });
  }

  public openWikiBackupNeeded(): void {
    let url =
      'https://support.bitpay.com/hc/en-us/articles/115002989283-Why-don-t-I-have-an-online-account-for-my-BitPay-wallet-';
    let optIn = true;
    let title = null;
    let message = this.translate.instant('Read more in our Wiki');
    let okText = this.translate.instant('Open');
    let cancelText = this.translate.instant('Go Back');
    this.externalLinkProvider.open(
      url,
      optIn,
      title,
      message,
      okText,
      cancelText
    );
  }

  public showMoreOptions(): void {
    let buttons = [];

    let specificAmountButton = {
      text: this.translate.instant('Request Specific Amount'),
      icon: 'calculator',
      handler: () => {
        this.requestSpecificAmount();
      }
    };
    let shareButton = {
      text: this.translate.instant('Share Address'),
      icon: 'share',
      handler: () => {
        this.shareAddress();
      }
    };

    buttons.push(specificAmountButton);

    if (
      this.showShareButton &&
      this.wallet &&
      this.wallet.isComplete() &&
      !this.wallet.needsBackup
    )
      buttons.push(shareButton);

    const actionSheet = this.actionSheetCtrl.create({
      buttons
    });

    actionSheet.present();
  }
}
