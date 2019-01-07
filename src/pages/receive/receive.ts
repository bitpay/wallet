import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events, NavController, Platform } from 'ionic-angular';
import { Observable, Subscription } from 'rxjs';
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

  private onResumeSubscription: Subscription;

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
      this.events.subscribe('Wallet/setAddress', (newAddr?: boolean) => {
        this.setAddress(newAddr);
      });
    });
  }

  ionViewWillLeave() {
    this.onResumeSubscription.unsubscribe();
  }

  ionViewDidLoad() {
    this.setAddress();
    this.events.subscribe('Wallet/setAddress', (newAddr?: boolean) => {
      this.setAddress(newAddr);
    });
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
      network: this.addressProvider.getNetwork(this.address)
    });
  }

  private async setAddress(newAddr?: boolean): Promise<void> {
    this.loading = newAddr || _.isEmpty(this.address) ? true : false;

    const addr: string = (await this.walletProvider
      .getAddress(this.wallet, newAddr)
      .catch(err => {
        this.loading = false;
        this.logger.warn(this.bwcErrorProvider.msg(err, 'Receive'));
      })) as string;
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
    this.navCtrl.push(BackupWarningPage, {
      walletId: this.wallet.credentials.walletId
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
