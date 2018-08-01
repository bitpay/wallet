import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events, NavController } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';

// Native
import { SocialSharing } from '@ionic-native/social-sharing';

// Pages
import { BackupWarningPage } from '../backup/backup-warning/backup-warning';
import { AmountPage } from '../send/amount/amount';

// Providers
import { ActionSheetProvider } from '../../providers/action-sheet/action-sheet';
import { AddressProvider } from '../../providers/address/address';
import { BwcErrorProvider } from '../../providers/bwc-error/bwc-error';
import { ExternalLinkProvider } from '../../providers/external-link/external-link';
import { PlatformProvider } from '../../providers/platform/platform';
import { ProfileProvider } from '../../providers/profile/profile';
import { WalletProvider } from '../../providers/wallet/wallet';

import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { WalletTabsChild } from '../wallet-tabs/wallet-tabs-child';
import { WalletTabsProvider } from '../wallet-tabs/wallet-tabs.provider';

@Component({
  selector: 'page-receive',
  templateUrl: 'receive.html'
})
export class ReceivePage extends WalletTabsChild {
  public protocolHandler: string;
  public address: string;
  public qrAddress: string;
  public wallets = [];
  public wallet;
  public showShareButton: boolean;
  public loading: boolean;
  public playAnimation: boolean;

  constructor(
    private actionSheetProvider: ActionSheetProvider,
    navCtrl: NavController,
    private logger: Logger,
    profileProvider: ProfileProvider,
    private walletProvider: WalletProvider,
    private platformProvider: PlatformProvider,
    private events: Events,
    private socialSharing: SocialSharing,
    private bwcErrorProvider: BwcErrorProvider,
    private translate: TranslateService,
    private externalLinkProvider: ExternalLinkProvider,
    private addressProvider: AddressProvider,
    walletTabsProvider: WalletTabsProvider
  ) {
    super(navCtrl, profileProvider, walletTabsProvider);
    this.showShareButton = this.platformProvider.isCordova;
  }

  ionViewDidLoad() {
    this.setAddress();
    if (this.wallet.needsBackup) {
      const infoSheet = this.actionSheetProvider.createInfoSheet(
        'paper-key-unverified'
      );
      infoSheet.present();
      infoSheet.onDidDismiss(option => {
        if (option) this.goToBackup();
      });
    }
  }

  ionViewWillEnter() {
    this.events.subscribe('Wallet/backupCompleted', () => {
      this.setAddress();
    });
    this.events.subscribe('Wallet/setAddress', () => {
      this.setAddress(true);
    });
  }

  ionViewWillLeave() {
    this.events.unsubscribe('Wallet/backupCompleted');
    this.events.unsubscribe('Wallet/setAddress');
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

  private async setAddress(
    newAddr?: boolean,
    changingWallet?: boolean
  ): Promise<void> {
    this.loading =
      newAddr || _.isEmpty(this.address) || changingWallet ? true : false;

    let addr: string = (await this.walletProvider
      .getAddress(this.wallet, newAddr)
      .catch(err => {
        this.loading = false;
        this.logger.warn(this.bwcErrorProvider.msg(err, 'Server Error'));
      })) as string;
    this.loading = false;
    let address = await this.walletProvider.getAddressView(this.wallet, addr);
    if (this.address && this.address != address) {
      this.playAnimation = true;
    }
    this.updateQrAddress(address, newAddr);
  }

  private async updateQrAddress(address?, newAddr?: boolean): Promise<void> {
    let qrAddress = await this.walletProvider.getProtoAddress(
      this.wallet,
      address
    );
    if (newAddr) {
      await Observable.timer(400).toPromise();
    }
    this.address = address;
    this.qrAddress = qrAddress;
    await Observable.timer(200).toPromise();
    this.playAnimation = false;
  }

  public shareAddress(): void {
    if (!this.showShareButton) return;
    this.socialSharing.share(this.address);
  }

  public goToBackup(): void {
    this.navCtrl.push(BackupWarningPage, {
      walletId: this.wallet.credentials.walletId
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
    const showShare =
      this.showShareButton &&
      this.wallet &&
      this.wallet.isComplete() &&
      !this.wallet.needsBackup;
    const optionsSheet = this.actionSheetProvider.createOptionsSheet(
      'address-options',
      { showShare }
    );
    optionsSheet.present();

    optionsSheet.onDidDismiss(option => {
      if (option == 'request-amount') this.requestSpecificAmount();
      if (option == 'share-address') this.shareAddress();
    });
  }

  public showFullAddr(): void {
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'address-copied',
      { address: this.address, coin: this.wallet.coin }
    );
    infoSheet.present();
  }
}
