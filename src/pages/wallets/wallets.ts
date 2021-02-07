import { Component, NgZone, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  Events,
  ModalController,
  NavController,
  Platform
} from 'ionic-angular';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

// Pages
import { AddPage } from '../add/add';
import { CopayersPage } from '../add/copayers/copayers';
import { BackupKeyPage } from '../backup/backup-key/backup-key';
import { CoinbaseAccountPage } from '../integrations/coinbase/coinbase-account/coinbase-account';
import { SettingsPage } from '../settings/settings';
import { WalletDetailsPage } from '../wallet-details/wallet-details';
import { ProposalsNotificationsPage } from './proposals-notifications/proposals-notifications';

// Providers
import { ActionSheetProvider } from '../../providers/action-sheet/action-sheet';
import { BwcErrorProvider } from '../../providers/bwc-error/bwc-error';
import { CoinbaseProvider } from '../../providers/coinbase/coinbase';
import { HomeIntegrationsProvider } from '../../providers/home-integrations/home-integrations';
import { Logger } from '../../providers/logger/logger';
import { PersistenceProvider } from '../../providers/persistence/persistence';
import { ProfileProvider } from '../../providers/profile/profile';
import { WalletProvider } from '../../providers/wallet/wallet';

interface UpdateWalletOptsI {
  walletId: string;
  force?: boolean;
  alsoUpdateHistory?: boolean;
}

@Component({
  selector: 'page-wallets',
  templateUrl: 'wallets.html'
})
export class WalletsPage {
  @ViewChild('priceCard')
  priceCard;
  public wallets;
  public walletsGroups;
  public txpsN: number;

  public collapsedGroups;

  private zone;
  private onResumeSubscription: Subscription;
  private onPauseSubscription: Subscription;

  public showCoinbase: boolean;
  public coinbaseLinked: boolean;
  public coinbaseData: object = {};

  constructor(
    private plt: Platform,
    private navCtrl: NavController,
    private profileProvider: ProfileProvider,
    private walletProvider: WalletProvider,
    private bwcErrorProvider: BwcErrorProvider,
    private logger: Logger,
    private events: Events,
    private homeIntegrationsProvider: HomeIntegrationsProvider,
    private persistenceProvider: PersistenceProvider,
    private translate: TranslateService,
    private modalCtrl: ModalController,
    private actionSheetProvider: ActionSheetProvider,
    private coinbaseProvider: CoinbaseProvider
  ) {
    this.collapsedGroups = {};
    this.zone = new NgZone({ enableLongStackTrace: false });
  }

  ionViewDidEnter() {
    this._didEnter();
  }

  ionViewWillEnter() {
    this.walletsGroups = this.profileProvider.orderedWalletsByGroup;

    // Get Coinbase Accounts and UserInfo
    this.setCoinbase();
  }

  private setCoinbase(force?) {
    this.showCoinbase = this.homeIntegrationsProvider.shouldShowInHome(
      'coinbase'
    );
    if (!this.showCoinbase) return;
    this.coinbaseLinked = this.coinbaseProvider.isLinked();
    if (this.coinbaseLinked) {
      if (force || _.isEmpty(this.coinbaseData)) {
        this.zone.run(() => {
          this.coinbaseProvider.preFetchAllData(this.coinbaseData);
        });
      } else this.coinbaseData = this.coinbaseProvider.coinbaseData;
    }
  }

  private _didEnter() {
    this.updateTxps();
  }

  private walletFocusHandler = opts => {
    this.logger.debug('RECV Local/WalletFocus @home', opts);
    opts = opts || {};
    opts.alsoUpdateHistory = true;
    this.fetchWalletStatus(opts);
  };

  private walletActionHandler = opts => {
    this.logger.debug('RECV Local/TxAction @home', opts);
    opts = opts || {};
    opts.alsoUpdateHistory = true;
    this.fetchWalletStatus(opts);
  };

  ionViewDidLoad() {
    this.logger.info('Loaded: WalletsPage');

    const subscribeEvents = () => {
      // BWS Events: Update Status per Wallet -> Update txps
      // NewBlock, NewCopayer, NewAddress, NewTxProposal, TxProposalAcceptedBy, TxProposalRejectedBy, txProposalFinallyRejected,
      // txProposalFinallyAccepted, TxProposalRemoved, NewIncomingTx, NewOutgoingTx
      this.events.subscribe('bwsEvent', this.bwsEventHandler);

      // Reject, Remove, OnlyPublish and SignAndBroadcast -> Update Status per Wallet -> Update txps
      this.events.subscribe('Local/TxAction', this.walletActionHandler);

      // Wallet is focused on some inner view, therefore, we refresh its status and txs
      this.events.subscribe('Local/WalletFocus', this.walletFocusHandler);
    };

    subscribeEvents();
    this.onResumeSubscription = this.plt.resume.subscribe(() => {
      subscribeEvents();
    });

    this.onPauseSubscription = this.plt.pause.subscribe(() => {
      this.events.unsubscribe('bwsEvent', this.bwsEventHandler);
      this.events.unsubscribe('Local/TxAction', this.walletFocusHandler);
      this.events.unsubscribe('Local/WalletFocus', this.walletFocusHandler);
    });
  }

  ngOnDestroy() {
    this.onResumeSubscription.unsubscribe();
    this.onPauseSubscription.unsubscribe();
  }

  private debounceFetchWalletStatus = _.debounce(
    async (walletId, alsoUpdateHistory) => {
      this.fetchWalletStatus({ walletId, alsoUpdateHistory });
    },
    3000
  );

  // BWS events can come many at time (publish,sign, broadcast...)
  private bwsEventHandler = (walletId, type, n) => {
    // NewBlock, NewCopayer, NewAddress, NewTxProposal, TxProposalAcceptedBy, TxProposalRejectedBy, txProposalFinallyRejected,
    // txProposalFinallyAccepted, TxProposalRemoved, NewIncomingTx, NewOutgoingTx

    const wallet = this.profileProvider.getWallet(walletId);
    if (!wallet) return;
    if (wallet.copayerId == n.creatorId) return;

    this.logger.info(`BWS Event: ${type}: `, n);

    let alsoUpdateHistory = false;
    switch (type) {
      case 'NewAddress':
        this.walletProvider.expireAddress(walletId);
        return;
      case 'NewIncomingTx':
      case 'NewOutgoingTx':
      case 'NewBlock':
        alsoUpdateHistory = true;
    }
    this.walletProvider.invalidateCache(wallet);
    this.debounceFetchWalletStatus(walletId, alsoUpdateHistory);
  };

  private debounceSetWallets = _.debounce(
    async () => {
      this.profileProvider.setOrderedWalletsByGroup();
      this.walletsGroups = this.profileProvider.orderedWalletsByGroup;
    },
    5000,
    {
      leading: true
    }
  );

  private debounceSetCoinbase = _.debounce(
    async () => {
      this.coinbaseProvider.updateExchangeRates();
      this.setCoinbase(true);
    },
    5000,
    {
      leading: true
    }
  );

  private fetchTxHistory(opts: UpdateWalletOptsI) {
    if (!opts.walletId) {
      this.logger.error('Error no walletId in update History');
      return;
    }
    const wallet = this.profileProvider.getWallet(opts.walletId);

    const progressFn = ((_, newTxs) => {
      let args = {
        walletId: opts.walletId,
        finished: false,
        progress: newTxs
      };
      this.events.publish('Local/WalletHistoryUpdate', args);
    }).bind(this);

    // Fire a startup event, to allow UI to show the spinner
    this.events.publish('Local/WalletHistoryUpdate', {
      walletId: opts.walletId,
      finished: false
    });
    this.walletProvider
      .fetchTxHistory(wallet, progressFn, opts)
      .then(txHistory => {
        wallet.completeHistory = txHistory;
        this.events.publish('Local/WalletHistoryUpdate', {
          walletId: opts.walletId,
          finished: true
        });
      })
      .catch(err => {
        if (err != 'HISTORY_IN_PROGRESS') {
          this.logger.warn('WalletHistoryUpdate ERROR', err);
          this.events.publish('Local/WalletHistoryUpdate', {
            walletId: opts.walletId,
            finished: false,
            error: err
          });
        }
      });
  }

  // Names:
  // .fetch => from BWS
  // .update => to UI
  /* This is the only .getStatus call in Copay */
  private fetchWalletStatus = (opts: UpdateWalletOptsI): void => {
    if (!opts.walletId) {
      this.logger.error('Error no walletId in update Wallet');
      return;
    }
    this.events.publish('Local/WalletUpdate', {
      walletId: opts.walletId,
      finished: false
    });

    this.logger.debug(
      'fetching status for: ' +
        opts.walletId +
        ' alsohistory:' +
        opts.alsoUpdateHistory
    );
    const wallet = this.profileProvider.getWallet(opts.walletId);
    if (!wallet) return;

    this.walletProvider
      .fetchStatus(wallet, opts)
      .then(status => {
        wallet.cachedStatus = status;
        wallet.error = wallet.errorObj = null;

        const balance =
          wallet.coin === 'xrp'
            ? wallet.cachedStatus.availableBalanceStr
            : wallet.cachedStatus.totalBalanceStr;

        this.persistenceProvider.setLastKnownBalance(wallet.id, balance);

        // Update txps
        this.updateTxps();
        this.events.publish('Local/WalletUpdate', {
          walletId: opts.walletId,
          finished: true
        });

        if (opts.alsoUpdateHistory) {
          this.fetchTxHistory({ walletId: opts.walletId, force: opts.force });
        }
      })
      .catch(err => {
        if (err == 'INPROGRESS') return;

        this.logger.warn('Update error:', err);

        this.processWalletError(wallet, err);

        this.events.publish('Local/WalletUpdate', {
          walletId: opts.walletId,
          finished: true,
          error: wallet.error
        });

        if (opts.alsoUpdateHistory) {
          this.fetchTxHistory({ walletId: opts.walletId, force: opts.force });
        }
      });
  };

  private updateTxps() {
    this.profileProvider
      .getTxps({ limit: 3 })
      .then(data => {
        this.events.publish('Local/UpdateTxps', {
          n: data.n
        });
        this.zone.run(() => {
          this.txpsN = data.n;
        });
      })
      .catch(err => {
        this.logger.error(err);
      });
  }

  private processWalletError(wallet, err): void {
    wallet.error = wallet.errorObj = null;

    if (!err || err == 'INPROGRESS') return;

    wallet.cachedStatus = null;
    wallet.errorObj = err;

    if (err.message === '403') {
      wallet.error = this.translate.instant('Access denied');
    } else if (err === 'WALLET_NOT_REGISTERED') {
      wallet.error = this.translate.instant('Wallet not registered');
    } else {
      wallet.error = this.bwcErrorProvider.msg(err);
    }
    this.logger.warn(
      this.bwcErrorProvider.msg(
        wallet.error,
        'Error updating status for ' + wallet.id
      )
    );
  }

  public goToWalletDetails(wallet): void {
    if (wallet.isComplete()) {
      this.navCtrl.push(WalletDetailsPage, {
        walletId: wallet.credentials.walletId
      });
    } else {
      const copayerModal = this.modalCtrl.create(
        CopayersPage,
        {
          walletId: wallet.credentials.walletId
        },
        {
          cssClass: 'wallet-details-modal'
        }
      );
      copayerModal.present();
    }
  }

  public openProposalsNotificationsPage(): void {
    this.navCtrl.push(ProposalsNotificationsPage);
  }

  public doRefresh(refresher): void {
    this.debounceSetWallets();
    this.debounceSetCoinbase();
    setTimeout(() => {
      refresher.complete();
    }, 2000);
  }

  public settings(): void {
    this.navCtrl.push(SettingsPage);
  }

  public collapseGroup(keyId: string) {
    this.collapsedGroups[keyId] = this.collapsedGroups[keyId] ? false : true;
  }

  public isCollapsed(keyId: string): boolean {
    return this.collapsedGroups[keyId] ? true : false;
  }

  public addWallet(keyId): void {
    this.navCtrl.push(AddPage, {
      keyId
    });
  }

  public openBackupPage(keyId) {
    this.navCtrl.push(BackupKeyPage, {
      keyId
    });
  }

  public showMoreOptions(): void {
    const walletTabOptionsAction = this.actionSheetProvider.createWalletTabOptions(
      { walletsGroups: this.walletsGroups }
    );
    walletTabOptionsAction.present();
    walletTabOptionsAction.onDidDismiss(data => {
      if (data)
        data.keyId
          ? this.addWallet(data.keyId)
          : this.navCtrl.push(AddPage, {
              isZeroState: true
            });
    });
  }

  public getNativeBalance(amount, currency): string {
    return this.coinbaseProvider.getNativeCurrencyBalance(amount, currency);
  }

  public goToCoinbaseAccount(id): void {
    this.navCtrl.push(CoinbaseAccountPage, {
      id
    });
  }
}
