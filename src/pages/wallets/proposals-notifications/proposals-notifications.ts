import { Component, NgZone, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  Events,
  ModalController,
  NavController,
  NavParams,
  Platform
} from 'ionic-angular';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

// providers
import { AddressBookProvider } from '../../../providers/address-book/address-book';
import { BwcErrorProvider } from '../../../providers/bwc-error/bwc-error';
import { ErrorsProvider } from '../../../providers/errors/errors';
import { Logger } from '../../../providers/logger/logger';
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { PlatformProvider } from '../../../providers/platform/platform';
import { ProfileProvider } from '../../../providers/profile/profile';
import { ReplaceParametersProvider } from '../../../providers/replace-parameters/replace-parameters';
import { WalletProvider } from '../../../providers/wallet/wallet';

// pages
import { FinishModalPage } from '../../finish/finish';

@Component({
  selector: 'page-proposals-notifications',
  templateUrl: 'proposals-notifications.html'
})
export class ProposalsNotificationsPage {
  @ViewChild('slideButton')
  slideButton;
  public addressbook;
  public allTxps: any[];
  public txpsPending: any[];
  public txpsAccepted: any[];
  public txpsRejected: any[];
  public txpsToSign: any[];
  public walletIdSelectedToSign: string;
  public isCordova: boolean;
  public buttonText: string;

  private zone;
  private onResumeSubscription: Subscription;
  private onPauseSubscription: Subscription;
  private isElectron: boolean;
  private walletId: string;
  private multisigContractAddress: string;

  constructor(
    private plt: Platform,
    private addressBookProvider: AddressBookProvider,
    private bwcErrorProvider: BwcErrorProvider,
    private logger: Logger,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private profileProvider: ProfileProvider,
    private platformProvider: PlatformProvider,
    private translate: TranslateService,
    private events: Events,
    private replaceParametersProvider: ReplaceParametersProvider,
    private walletProvider: WalletProvider,
    private modalCtrl: ModalController,
    private navCtrl: NavController,
    private navParams: NavParams,
    private errorsProvider: ErrorsProvider
  ) {
    this.zone = new NgZone({ enableLongStackTrace: false });
    this.isElectron = this.platformProvider.isElectron;
    this.walletId = this.navParams.data.walletId;
    this.multisigContractAddress = this.navParams.data.multisigContractAddress;
    this.isCordova = this.platformProvider.isCordova;
    this.buttonText = this.translate.instant('Sign selected proposals');

    this.allTxps = [];
    this.txpsToSign = [];
    this.txpsPending = [];
    this.txpsAccepted = [];
    this.txpsRejected = [];
  }

  ionViewWillEnter() {
    this.navCtrl.swipeBackEnabled = false;
    this.updateAddressBook();
    this.updatePendingProposals();
    this.subscribeEvents();
    this.onResumeSubscription = this.plt.resume.subscribe(() => {
      this.subscribeEvents();
    });
    this.onPauseSubscription = this.plt.pause.subscribe(() => {
      this.unsubscribeEvents();
    });

    // Update Wallet on Focus
    if (this.isElectron) {
      this.updateDesktopOnFocus();
    }
  }

  subscribeEvents() {
    this.events.subscribe('Local/WalletUpdate', this.updatePendingProposals);
  }

  unsubscribeEvents() {
    this.events.unsubscribe('Local/WalletUpdate', this.updatePendingProposals);
  }

  ionViewWillLeave() {
    this.unsubscribeEvents();
    this.navCtrl.swipeBackEnabled = true;
  }

  ngOnDestroy() {
    this.onResumeSubscription.unsubscribe();
    this.onPauseSubscription.unsubscribe();
  }

  private updateDesktopOnFocus() {
    const { remote } = (window as any).require('electron');
    const win = remote.getCurrentWindow();
    win.on('focus', () => {
      if (
        this.navCtrl.getActive() &&
        this.navCtrl.getActive().name === 'ProposalsNotificationsPage'
      )
        this.updatePendingProposals();
    });
  }

  private updateAddressBook(): void {
    this.addressBookProvider
      .list()
      .then(ab => {
        this.addressbook = ab || {};
      })
      .catch(err => {
        this.logger.error(err);
      });
  }

  private updatePendingProposals = (opts = { finished: true }): void => {
    if (!opts.finished) return;

    this.profileProvider
      .getTxps({ limit: 50 })
      .then(txpsData => {
        this.zone.run(() => {
          this.allTxps = [];

          // Check if txp were checked before
          txpsData.txps.forEach(txp => {
            txp.checked = _.indexOf(this.txpsToSign, txp) >= 0 ? true : false;
          });

          if (this.walletId) {
            txpsData.txps = _.filter(txpsData.txps, txps => {
              return txps.walletId == this.walletId;
            });
          } else if (this.multisigContractAddress) {
            txpsData.txps = _.filter(txpsData.txps, txps => {
              return (
                txps.multisigContractAddress == this.multisigContractAddress
              );
            });
          }

          this.checkStatus(txpsData.txps);
          this.allTxps.push({
            title: this.translate.instant('Payment Proposal'),
            type: 'pending',
            data: this.groupByWallets(this.txpsPending)
          });
          this.allTxps.push({
            title: this.translate.instant('Accepted'),
            type: 'accepted',
            data: this.groupByWallets(this.txpsAccepted)
          });
          this.allTxps.push({
            title: this.translate.instant('Rejected'),
            type: 'rejected',
            data: this.groupByWallets(this.txpsRejected)
          });

          if (
            this.navCtrl.canGoBack() &&
            !this.txpsPending[0] &&
            !this.txpsAccepted[0] &&
            !this.txpsRejected[0]
          ) {
            this.navCtrl.pop();
          }
        });
      })
      .catch(err => {
        this.logger.error(err);
      });
  };

  private checkStatus(txps: any[]): void {
    this.txpsPending = [];
    this.txpsAccepted = [];
    this.txpsRejected = [];

    txps.forEach(txp => {
      const action: any = _.find(txp.actions, {
        copayerId: txp.wallet.copayerId
      });

      if ((!action || action.type === 'failed') && txp.status == 'pending') {
        txp.pendingForUs = true;
      }

      if (action && action.type == 'accept') {
        txp.statusForUs = 'accepted';
        this.txpsAccepted.push(txp);
      } else if (action && action.type == 'reject') {
        txp.statusForUs = 'rejected';
        this.txpsRejected.push(txp);
      } else {
        txp.statusForUs = 'pending';
        this.txpsPending.push(txp);
      }
    });
  }

  private groupByWallets(txps): any[] {
    const walletIdGetter = txp => txp.walletId;
    const map = new Map();
    const txpsByWallet: any[] = [];

    txps.forEach(txp => {
      const walletId = walletIdGetter(txp);
      const collection = map.get(walletId);

      if (!collection) {
        map.set(walletId, [txp]);
      } else {
        collection.push(txp);
      }
    });
    Array.from(map).forEach(txpsPerWallet => {
      const txpToBeSigned = this.getTxpToBeSigned(txpsPerWallet[1]);
      txpsByWallet.push({
        walletId: txpsPerWallet[0],
        canSign: txpsPerWallet[1][0].wallet.canSign || false,
        txps: txpsPerWallet[1],
        multipleSignAvailable:
          txpToBeSigned > 1 && !txpsPerWallet[1][0].multisigContractAddress
      });
    });
    return txpsByWallet;
  }

  private getTxpToBeSigned(txpsPerWallet): number {
    let i = 0;
    txpsPerWallet.forEach(txp => {
      if (txp.statusForUs === 'pending') i = i + 1;
    });
    return i;
  }

  public signMultipleProposals(txp): void {
    this.txpsToSign = [];
    this.walletIdSelectedToSign =
      this.walletIdSelectedToSign == txp.walletId
        ? this.resetMultiSignValues()
        : txp.walletId;
  }

  public sign(): void {
    const wallet = this.txpsToSign[0].wallet
      ? this.txpsToSign[0].wallet
      : this.profileProvider.getWallet(this.txpsToSign[0].walletId);
    this.walletProvider
      .signMultipleTxps(wallet, this.txpsToSign)
      .then(data => {
        this.resetMultiSignValues();
        this.onGoingProcessProvider.clear();
        const count = this.countSuccessAndFailed(data);
        if (count.failed > 0) {
          const signErr = this.replaceParametersProvider.replace(
            this.translate.instant(
              'There was problem while trying to sign {{txpsFailed}} of your transactions proposals. Please, try again'
            ),
            { txpsFailed: count.failed }
          );
          const title = this.translate.instant('Error');
          this.showErrorInfoSheet(title, signErr);
        }
        if (count.success > 0) {
          const finishText: string = this.replaceParametersProvider.replace(
            count.success > 1
              ? this.translate.instant('{{txpsSuccess}} proposals signed')
              : this.translate.instant('{{txpsSuccess}} proposal signed'),
            { txpsSuccess: count.success }
          );
          this.openModal(finishText, null, 'success');
        }
        // own TxActions  are not triggered?
        this.events.publish('Local/TxAction', wallet.walletId);
      })
      .catch(err => {
        this.logger.error('Sign multiple transaction proposals failed: ', err);
        this.onGoingProcessProvider.clear();
        if (
          err &&
          err.message != 'FINGERPRINT_CANCELLED' &&
          err.message != 'PASSWORD_CANCELLED'
        ) {
          if (err.message == 'WRONG_PASSWORD') {
            this.errorsProvider.showWrongEncryptPasswordError();
          } else {
            const title = this.translate.instant('Error');
            const msg = this.bwcErrorProvider.msg(err);
            this.showErrorInfoSheet(title, msg);
          }
        }
      });
  }

  private showErrorInfoSheet(title: string, msg: string): void {
    this.errorsProvider.showDefaultError(msg, title);
  }

  private countSuccessAndFailed(arrayData) {
    const count = { success: 0, failed: 0 };
    arrayData.forEach(data => {
      if (data.id) {
        count.success = count.success + 1;
      } else {
        count.failed = count.failed + 1;
      }
    });
    return count;
  }

  public txpSelectionChange(txp): void {
    if (_.indexOf(this.txpsToSign, txp) >= 0) {
      _.remove(this.txpsToSign, txpToSign => {
        return txpToSign.id == txp.id;
      });
      txp.checked = false;
    } else {
      txp.checked = true;
      this.txpsToSign.push(txp);
    }
  }

  private resetMultiSignValues(): void {
    this.allTxps.forEach(txpsByStatus => {
      txpsByStatus.data.forEach(txpsByWallet => {
        if (txpsByWallet.walletId == this.walletIdSelectedToSign) {
          txpsByWallet.txps.forEach(txp => {
            txp.checked = false;
          });
        }
      });
    });

    this.txpsToSign = [];
    this.walletIdSelectedToSign = null;
  }

  private openModal(finishText, finishComment, cssClass): void {
    const modal = this.modalCtrl.create(
      FinishModalPage,
      {
        finishText,
        finishComment,
        cssClass
      },
      { showBackdrop: true, enableBackdropDismiss: false }
    );
    modal.present();
  }

  public selectAll(txpsByWallet): void {
    this.zone.run(() => {
      this.txpsToSign = [];

      txpsByWallet.txps.forEach(txp => {
        this.txpsToSign.push(txp);
        txp.checked = true;
      });
    });
  }
}
