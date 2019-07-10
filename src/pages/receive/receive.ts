import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events, NavController, Platform } from 'ionic-angular';
import { Observable, Subscription } from 'rxjs';
import { Logger } from '../../providers/logger/logger';

// Native
import { SocialSharing } from '@ionic-native/social-sharing';

// Pages
import { BackupKeyPage } from '../backup/backup-key/backup-key';
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
  public wallet;
  public showShareButton: boolean;
  public loading: boolean;
  public playAnimation: boolean;
  public newAddressError: boolean;

  private onResumeSubscription: Subscription;
  private retryCount: number = 0;

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
    walletTabsProvider: WalletTabsProvider,
    private platform: Platform
  ) {
    super(navCtrl, profileProvider, walletTabsProvider);
    this.showShareButton = this.platformProvider.isCordova;
  }

  ionViewWillEnter() {
    this.onResumeSubscription = this.platform.resume.subscribe(() => {
      this.setAddress();
      this.events.subscribe('bwsEvent', this.bwsEventHandler);
    });
    this.setAddress();
  }

  ionViewWillLeave() {
    this.onResumeSubscription.unsubscribe();
  }

  ionViewDidLoad() {
    this.events.subscribe('bwsEvent', this.bwsEventHandler);
  }

  private bwsEventHandler: any = (walletId, type, n) => {
    if (
      this.wallet.credentials.walletId == walletId &&
      type == 'NewIncomingTx' &&
      n.data
    ) {
      let addr =
        this.address.indexOf(':') > -1
          ? this.address.split(':')[1]
          : this.address;
      if (n.data.address == addr) this.setAddress(true);
    }
  };

  public requestSpecificAmount(): void {
    this.navCtrl.push(AmountPage, {
      toAddress: this.address,
      id: this.wallet.credentials.walletId,
      recipientType: 'wallet',
      name: this.wallet.name,
      color: this.wallet.color,
      coin: this.wallet.coin,
      nextPage: 'CustomAmountPage',
      network: this.addressProvider.getNetwork(this.address)
    });
  }

  public async setAddress(newAddr?: boolean, failed?: boolean): Promise<void> {
    if (
      !this.wallet ||
      !this.wallet.isComplete() ||
      (this.wallet.needsBackup && this.wallet.network == 'livenet')
    )
      return;

    this.loading = newAddr || _.isEmpty(this.address) ? true : false;

    this.walletProvider
      .getAddress(this.wallet, newAddr)
      .then(addr => {
        this.newAddressError = false;
        this.loading = false;
        if (!addr) return;
        const address = this.walletProvider.getAddressView(
          this.wallet.coin,
          this.wallet.network,
          addr
        );
        if (this.address && this.address != address) {
          this.playAnimation = true;
        }
        this.updateQrAddress(address, newAddr);
      })
      .catch(err => {
        this.logger.warn('Retrying to create new adress:' + ++this.retryCount);
        if (this.retryCount > 3) {
          this.retryCount = 0;
          this.loading = false;
          this.showErrorInfoSheet(err);
        } else if (err == 'INVALID_ADDRESS') {
          // Generate new address if the first one is invalid ( fix for concatenated addresses )
          if (!failed) {
            this.setAddress(newAddr, true);
            this.logger.warn(this.bwcErrorProvider.msg(err, 'Receive'));
            return;
          }
          this.setAddress(false); // failed to generate new address -> get last saved address
        } else {
          this.setAddress(false); // failed to generate new address -> get last saved address
        }
        this.logger.warn(this.bwcErrorProvider.msg(err, 'Receive'));
      });
  }

  public showErrorInfoSheet(error: Error | string): void {
    this.newAddressError = true;
    const infoSheetTitle = this.translate.instant('Error');
    const errorInfoSheet = this.actionSheetProvider.createInfoSheet(
      'default-error',
      { msg: this.bwcErrorProvider.msg(error), title: infoSheetTitle }
    );
    errorInfoSheet.present();
  }

  private async updateQrAddress(address, newAddr?: boolean): Promise<void> {
    if (newAddr) {
      await Observable.timer(400).toPromise();
    }
    this.address = address;
    await Observable.timer(200).toPromise();
    this.playAnimation = false;
  }

  public shareAddress(): void {
    if (!this.showShareButton) return;
    this.socialSharing.share(this.address);
  }

  public goToBackup(): void {
    this.navCtrl.push(BackupKeyPage, {
      keyId: this.wallet.credentials.keyId
    });
  }

  public openWikiBackupNeeded(): void {
    const url =
      'https://support.bitpay.com/hc/en-us/articles/115002989283-Why-don-t-I-have-an-online-account-for-my-BitPay-wallet-';
    const optIn = true;
    const title = null;
    const message = this.translate.instant('Read more in our Wiki');
    const okText = this.translate.instant('Open');
    const cancelText = this.translate.instant('Go Back');
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
