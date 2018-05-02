import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events, NavController, NavParams } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';

// providers
import { AddressBookProvider } from '../../providers/address-book/address-book';
import { BwcErrorProvider } from '../../providers/bwc-error/bwc-error';
import { OnGoingProcessProvider } from '../../providers/on-going-process/on-going-process';
import { ProfileProvider } from '../../providers/profile/profile';
import { TimeProvider } from '../../providers/time/time';
import { WalletProvider } from '../../providers/wallet/wallet';

// pages
import { BackupWarningPage } from '../../pages/backup/backup-warning/backup-warning';
import { WalletAddressesPage } from '../../pages/settings/wallet-settings/wallet-settings-advanced/wallet-addresses/wallet-addresses';
import { TxDetailsPage } from '../../pages/tx-details/tx-details';
import { WalletBalancePage } from './wallet-balance/wallet-balance';

import * as _ from 'lodash';

const HISTORY_SHOW_LIMIT = 10;

@Component({
  selector: 'page-wallet-details',
  templateUrl: 'wallet-details.html'
})
export class WalletDetailsPage {
  private currentPage: number = 0;

  public requiresMultipleSignatures: boolean;
  public wallet: any;
  public history: any = [];
  public walletNotRegistered: boolean;
  public updateError: boolean;
  public updateStatusError: any;
  public updatingStatus: boolean;
  public updatingTxHistory: boolean;
  public updateTxHistoryError: boolean;
  public updatingTxHistoryProgress: number = 0;
  public showNoTransactionsYetMsg: boolean;
  public showBalanceButton: boolean = false;
  public addressbook: any = {};
  public txps: any[] = [];

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private profileProvider: ProfileProvider,
    private walletProvider: WalletProvider,
    private addressbookProvider: AddressBookProvider,
    private bwcError: BwcErrorProvider,
    private events: Events,
    private logger: Logger,
    private timeProvider: TimeProvider,
    private translate: TranslateService,
    private onGoingProcessProvider: OnGoingProcessProvider
  ) {
    let clearCache = this.navParams.data.clearCache;
    this.wallet = this.profileProvider.getWallet(this.navParams.data.walletId);
    // Getting info from cache
    if (clearCache) {
      this.clearHistoryCache();
    } else {
      this.wallet.status = this.wallet.cachedStatus;
      if (this.wallet.completeHistory) this.showHistory();
    }

    this.requiresMultipleSignatures = this.wallet.credentials.m > 1;

    this.addressbookProvider.list().then((ab) => {
      this.addressbook = ab;
    }).catch((err) => {
      this.logger.error(err);
    });
  }

  ionViewDidEnter() {
    this.updateAll();
  }

  ionViewWillEnter() {
    this.events.subscribe('bwsEvent', (walletId, type, n) => {
      if (walletId == this.wallet.id && type != 'NewAddress')
        this.updateAll();
    });
    this.events.subscribe('Local/TxAction', (walletId) => {
      if (walletId == this.wallet.id)
        this.updateAll();
    });
  }

  ionViewWillLeave() {
    this.events.unsubscribe('Local/TxAction');
    this.events.unsubscribe('bwsEvent');
  }

  private clearHistoryCache() {
    this.history = [];
    this.currentPage = 0;
  }

  private showHistory() {
    this.history = this.wallet.completeHistory.slice(0, (this.currentPage + 1) * HISTORY_SHOW_LIMIT);
    this.currentPage++;
  }

  private setPendingTxps(txps: any[]) {

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

    let progressFn = (function (txs, newTxs) {
      if (newTxs > 5) this.thistory = null;
      this.updatingTxHistoryProgress = newTxs;
    }).bind(this);

    this.walletProvider.getTxHistory(this.wallet, {
      progressFn
    }).then((txHistory) => {
      this.updatingTxHistory = false;

      let hasTx = txHistory[0];
      this.showNoTransactionsYetMsg = hasTx ? false : true;

      this.wallet.completeHistory = txHistory;
      this.showHistory();
    }).catch((err) => {
      this.updatingTxHistory = false;
      this.updateTxHistoryError = true;
    });
  }

  private updateAll = _.debounce((force?) => {
    this.updateStatus(force);
    this.updateTxHistory();
  }, 2000, {
    'leading': true
  });

  public toggleBalance() {
    this.profileProvider.toggleHideBalanceFlag(this.wallet.credentials.walletId);
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

    this.walletProvider.getStatus(this.wallet, { force: !!force }).then((status: any) => {
      this.updatingStatus = false;
      this.setPendingTxps(status.pendingTxps);
      this.wallet.status = status;
      this.showBalanceButton = (this.wallet.status.totalBalanceSat != this.wallet.status.spendableAmount);
    }).catch((err) => {
      this.updatingStatus = false;
      if (err === 'WALLET_NOT_REGISTERED') {
        this.walletNotRegistered = true;
      } else {
        this.updateStatusError = this.bwcError.msg(err, this.translate.instant('Could not update wallet'));
      }
      this.wallet.status = null;
    });
  };

  public recreate() {
    this.onGoingProcessProvider.set('recreating');
    this.walletProvider.recreate(this.wallet).then(() => {
      this.onGoingProcessProvider.clear();
      setTimeout(() => {
        this.walletProvider.startScan(this.wallet).then(() => {
          this.updateAll(true);
        });
      });
    }).catch((err) => {
      this.onGoingProcessProvider.clear();
      this.logger.error(err);
    });
  };

  public goToTxDetails(tx: any) {
    this.navCtrl.push(TxDetailsPage, { walletId: this.wallet.credentials.walletId, txid: tx.txid });
  }

  public openBackup() {
    this.navCtrl.push(BackupWarningPage, { walletId: this.wallet.credentials.walletId });
  }

  public openAddresses() {
    this.navCtrl.push(WalletAddressesPage, { walletId: this.wallet.credentials.walletId });
  }

  public getDate(txCreated) {
    let date = new Date(txCreated * 1000);
    return date;
  };

  public trackByFn(index, tx) {
    return index;
  };

  public isFirstInGroup(index) {
    if (index === 0) {
      return true;
    }
    let curTx = this.history[index];
    let prevTx = this.history[index - 1];
    return !this.createdDuringSameMonth(curTx, prevTx);
  };

  private createdDuringSameMonth(curTx, prevTx) {
    return this.timeProvider.withinSameMonth(curTx.time * 1000, prevTx.time * 1000);
  };

  public isDateInCurrentMonth(date) {
    return this.timeProvider.isDateInCurrentMonth(date);
  };

  public createdWithinPastDay(time) {
    return this.timeProvider.withinPastDay(time);
  };

  public isUnconfirmed(tx) {
    return !tx.confirmations || tx.confirmations === 0;
  };

  public openBalanceDetails(): void {
    this.navCtrl.push(WalletBalancePage, { status: this.wallet.status });
  }

  public back(): void {
    this.navCtrl.pop();
  }

}
