import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  Events,
  ModalController,
  NavController,
  NavParams
} from 'ionic-angular';
import * as _ from 'lodash';

// providers
import { AddressBookProvider } from '../../providers/address-book/address-book';
import { BwcErrorProvider } from '../../providers/bwc-error/bwc-error';
import { ExternalLinkProvider } from '../../providers/external-link/external-link';
import { ActionSheetProvider } from '../../providers/index';
import { Logger } from '../../providers/logger/logger';
import { OnGoingProcessProvider } from '../../providers/on-going-process/on-going-process';
import { ProfileProvider } from '../../providers/profile/profile';
import { TimeProvider } from '../../providers/time/time';
import { WalletProvider } from '../../providers/wallet/wallet';

// pages
import { BackupWarningPage } from '../../pages/backup/backup-warning/backup-warning';
import { WalletAddressesPage } from '../../pages/settings/wallet-settings/wallet-settings-advanced/wallet-addresses/wallet-addresses';
import { TxDetailsPage } from '../../pages/tx-details/tx-details';
import { WalletSettingsPage } from '../settings/wallet-settings/wallet-settings';
import { WalletTabsChild } from '../wallet-tabs/wallet-tabs-child';
import { WalletTabsProvider } from '../wallet-tabs/wallet-tabs.provider';
import { SearchTxModalPage } from './search-tx-modal/search-tx-modal';
import { WalletBalancePage } from './wallet-balance/wallet-balance';

const HISTORY_SHOW_LIMIT = 10;

@Component({
  selector: 'page-wallet-details',
  templateUrl: 'wallet-details.html'
})
export class WalletDetailsPage extends WalletTabsChild {
  private currentPage: number = 0;
  private showBackupNeededMsg: boolean = true;

  public requiresMultipleSignatures: boolean;
  public wallet;
  public history = [];
  public groupedHistory = [];
  public walletNotRegistered: boolean;
  public updateError: boolean;
  public updateStatusError;
  public updatingStatus: boolean;
  public updatingTxHistory: boolean;
  public updateTxHistoryError: boolean;
  public updatingTxHistoryProgress: number = 0;
  public showNoTransactionsYetMsg: boolean;
  public showBalanceButton: boolean = false;
  public addressbook = {};
  public txps = [];

  constructor(
    navCtrl: NavController,
    private navParams: NavParams,
    profileProvider: ProfileProvider,
    private walletProvider: WalletProvider,
    private addressbookProvider: AddressBookProvider,
    private bwcError: BwcErrorProvider,
    private events: Events,
    private logger: Logger,
    private timeProvider: TimeProvider,
    private translate: TranslateService,
    private modalCtrl: ModalController,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private externalLinkProvider: ExternalLinkProvider,
    walletTabsProvider: WalletTabsProvider,
    private actionSheetProvider: ActionSheetProvider
  ) {
    super(navCtrl, profileProvider, walletTabsProvider);
  }

  ionViewDidLoad() {
    // Getting info from cache
    if (this.navParams.data.clearCache) {
      this.clearHistoryCache();
    } else {
      this.wallet.status = this.wallet.cachedStatus;
      if (this.wallet.completeHistory) this.showHistory();
    }

    this.requiresMultipleSignatures = this.wallet.credentials.m > 1;

    this.addressbookProvider
      .list()
      .then(ab => {
        this.addressbook = ab;
      })
      .catch(err => {
        this.logger.error(err);
      });
  }

  ionViewWillEnter() {
    this.events.subscribe('Wallet/updateAll', () => {
      this.updateAll();
    });
  }

  ionViewDidEnter() {
    this.updateAll();
  }

  ionViewWillLeave() {
    this.events.unsubscribe('Wallet/updateAll');
  }

  shouldShowZeroState() {
    return this.showNoTransactionsYetMsg && !this.updateStatusError;
  }

  shouldShowSpinner() {
    return (
      (this.updatingStatus || this.updatingTxHistory) &&
      !this.walletNotRegistered &&
      !this.updateStatusError &&
      !this.updateTxHistoryError
    );
  }

  goToPreferences() {
    this.navCtrl.push(WalletSettingsPage, { walletId: this.wallet.id });
  }

  private clearHistoryCache() {
    this.history = [];
    this.currentPage = 0;
  }

  private groupHistory(history) {
    return history.reduce((groups, tx, txInd) => {
      this.isFirstInGroup(txInd)
        ? groups.push([tx])
        : groups[groups.length - 1].push(tx);
      return groups;
    }, []);
  }

  private showHistory() {
    this.history = this.wallet.completeHistory.slice(
      0,
      (this.currentPage + 1) * HISTORY_SHOW_LIMIT
    );
    this.groupedHistory = this.groupHistory(this.history);
    this.currentPage++;
  }

  private setPendingTxps(txps) {
    /* Uncomment to test multiple outputs */

    // var txp = {
    //   message: 'test multi-output',
    //   fee: 1000,
    //   createdOn: new Date() / 1000,
    //   outputs: [],
    //   wallet: $scope.wallet
    // };
    //
    // function addOutput(n) {
    //   txp.outputs.push({
    //     amount: 600,
    //     toAddress: '2N8bhEwbKtMvR2jqMRcTCQqzHP6zXGToXcK',
    //     message: 'output #' + (Number(n) + 1)
    //   });
    // };
    // lodash.times(15, addOutput);
    // txps.push(txp);
    this.txps = !txps ? [] : _.sortBy(txps, 'createdOn').reverse();
  }

  private updateTxHistory() {
    this.updatingTxHistory = true;

    this.updateTxHistoryError = false;
    this.updatingTxHistoryProgress = 0;

    let progressFn = function(_, newTxs) {
      if (newTxs > 5) this.thistory = null;
      this.updatingTxHistoryProgress = newTxs;
    }.bind(this);

    this.walletProvider
      .getTxHistory(this.wallet, {
        progressFn
      })
      .then(txHistory => {
        this.updatingTxHistory = false;

        let hasTx = txHistory[0];
        this.showNoTransactionsYetMsg = hasTx ? false : true;

        if (this.wallet.needsBackup && hasTx && this.showBackupNeededMsg)
          this.openBackupModal();

        this.wallet.completeHistory = txHistory;
        this.showHistory();
      })
      .catch(() => {
        this.updatingTxHistory = false;
        this.updateTxHistoryError = true;
      });
  }

  private updateAll = _.debounce(
    (force?) => {
      this.updateStatus(force);
      this.updateTxHistory();
    },
    2000,
    {
      leading: true
    }
  );

  public toggleBalance() {
    this.profileProvider.toggleHideBalanceFlag(
      this.wallet.credentials.walletId
    );
  }

  public loadHistory(loading) {
    if (this.history.length === this.wallet.completeHistory.length) {
      loading.complete();
      return;
    }
    setTimeout(() => {
      this.showHistory();
      loading.complete();
    }, 300);
  }

  private updateStatus(force?: boolean) {
    this.updatingStatus = true;
    this.updateStatusError = null;
    this.walletNotRegistered = false;
    this.showBalanceButton = false;

    this.walletProvider
      .getStatus(this.wallet, { force: !!force })
      .then(status => {
        this.updatingStatus = false;
        this.setPendingTxps(status.pendingTxps);
        this.wallet.status = status;
        this.showBalanceButton =
          this.wallet.status.totalBalanceSat !=
          this.wallet.status.spendableAmount;
      })
      .catch(err => {
        this.updatingStatus = false;
        if (err === 'WALLET_NOT_REGISTERED') {
          this.walletNotRegistered = true;
        } else {
          this.updateStatusError = this.bwcError.msg(
            err,
            this.translate.instant('Could not update wallet')
          );
        }
        this.wallet.status = null;
      });
  }

  public recreate() {
    this.onGoingProcessProvider.set('recreating');
    this.walletProvider
      .recreate(this.wallet)
      .then(() => {
        this.onGoingProcessProvider.clear();
        setTimeout(() => {
          this.walletProvider.startScan(this.wallet).then(() => {
            this.updateAll(true);
          });
        });
      })
      .catch(err => {
        this.onGoingProcessProvider.clear();
        this.logger.error(err);
      });
  }

  public goToTxDetails(tx) {
    this.navCtrl.push(TxDetailsPage, {
      walletId: this.wallet.credentials.walletId,
      txid: tx.txid
    });
  }

  public openBackupModal(): void {
    this.showBackupNeededMsg = false;
    const infoSheet = this.actionSheetProvider.createInfoSheet(
      'backup-needed-with-activity'
    );
    infoSheet.present();
    infoSheet.onDidDismiss(option => {
      if (option) this.openBackup();
    });
  }

  public openBackup() {
    this.navCtrl.push(BackupWarningPage, {
      walletId: this.wallet.credentials.walletId
    });
  }

  public openAddresses() {
    this.navCtrl.push(WalletAddressesPage, {
      walletId: this.wallet.credentials.walletId
    });
  }

  public getDate(txCreated) {
    let date = new Date(txCreated * 1000);
    return date;
  }

  public trackByFn(index) {
    return index;
  }

  public isFirstInGroup(index) {
    if (index === 0) {
      return true;
    }
    let curTx = this.history[index];
    let prevTx = this.history[index - 1];
    return !this.createdDuringSameMonth(curTx, prevTx);
  }

  private createdDuringSameMonth(curTx, prevTx) {
    return this.timeProvider.withinSameMonth(
      curTx.time * 1000,
      prevTx.time * 1000
    );
  }

  public isDateInCurrentMonth(date) {
    return this.timeProvider.isDateInCurrentMonth(date);
  }

  public createdWithinPastDay(time) {
    return this.timeProvider.withinPastDay(time);
  }

  public isUnconfirmed(tx) {
    return !tx.confirmations || tx.confirmations === 0;
  }

  public openBalanceDetails(): void {
    this.navCtrl.push(WalletBalancePage, {
      status: this.wallet.status,
      color: this.wallet.color
    });
  }

  public back(): void {
    this.navCtrl.pop();
  }

  public openSearchModal(): void {
    let modal = this.modalCtrl.create(
      SearchTxModalPage,
      {
        addressbook: this.addressbook,
        completeHistory: this.wallet.completeHistory,
        wallet: this.wallet
      },
      { showBackdrop: false, enableBackdropDismiss: true }
    );
    modal.present();
    modal.onDidDismiss(data => {
      if (!data || !data.txid) return;
      this.navCtrl.push(TxDetailsPage, {
        walletId: this.wallet.credentials.walletId,
        txid: data.txid
      });
    });
  }

  public openExternalLink(url: string): void {
    let optIn = true;
    let title = null;
    let message = this.translate.instant(
      'Help and support information is available at the website.'
    );
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
}
