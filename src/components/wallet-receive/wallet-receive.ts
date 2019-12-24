import { Component } from '@angular/core';
// import { NavController } from 'ionic-angular';
import { Subscription } from 'rxjs';
import { Logger } from '../../providers/logger/logger';
import { ActionSheetParent } from '../action-sheet/action-sheet-parent';

// Native
// import { SocialSharing } from '@ionic-native/social-sharing';

// Pages
// import { BackupKeyPage } from '../../pages/backup/backup-key/backup-key';

// Providers
import { BwcErrorProvider } from '../../providers/bwc-error/bwc-error';
import { WalletProvider } from '../../providers/wallet/wallet';

import { Events, Platform } from 'ionic-angular';
import * as _ from 'lodash';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'wallet-receive',
  templateUrl: 'wallet-receive.html'
})
export class WalletReceiveComponent extends ActionSheetParent {
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
    private logger: Logger,
    private walletProvider: WalletProvider,
    private events: Events,
    private bwcErrorProvider: BwcErrorProvider,
    private platform: Platform
  ) {
    super();
  }

  ngOnInit() {
    this.wallet = this.params.wallet;
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
          this.dismiss(err);
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

  private async updateQrAddress(address, newAddr?: boolean): Promise<void> {
    if (newAddr) {
      await Observable.timer(400).toPromise();
    }
    this.address = address;
    await Observable.timer(200).toPromise();
    this.playAnimation = false;
  }
}
