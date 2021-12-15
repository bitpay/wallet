import { HttpClient } from '@angular/common/http';
import { Component, NgZone, ViewChild, ViewEncapsulation } from '@angular/core';
// import { TranslateService } from '@ngx-translate/core';

import * as _ from 'lodash';
import { Subscription } from 'rxjs';

// Pages
import { CopayersPage } from '../add/copayers/copayers';

// Providers
import { ActionSheetProvider } from '../../providers/action-sheet/action-sheet';
import { AnalyticsProvider } from '../../providers/analytics/analytics';
// import { BwcErrorProvider } from '../../providers/bwc-error/bwc-error';
import { Logger } from '../../providers/logger/logger';
import { PersistenceProvider } from '../../providers/persistence/persistence';
import { PlatformProvider } from '../../providers/platform/platform';
import { ProfileProvider } from '../../providers/profile/profile';
import { WalletProvider } from '../../providers/wallet/wallet';
import { LoadingController, ModalController, NavController, NavParams, Platform } from '@ionic/angular';
import { EventManagerService } from 'src/app/providers/event-manager.service';
import { Router } from '@angular/router';

interface UpdateWalletOptsI {
  walletId: string;
  force?: boolean;
  alsoUpdateHistory?: boolean;
}

@Component({
  selector: 'page-wallets',
  templateUrl: 'wallets.html',
  styleUrls: ['wallets.scss'],
  encapsulation: ViewEncapsulation.None
})
export class WalletsPage {
  @ViewChild('priceCard')
  priceCard;
  public wallets;
  public walletsGroups = [];
  public txpsN: number;

  public collapsedGroups;

  private zone;
  private onResumeSubscription: Subscription;
  private onPauseSubscription: Subscription;
  isDonation;
  donationSupportCoins = [];
  navParamsData;
  isShowCreateNewWallet = false;
  constructor(
    public http: HttpClient,
    private plt: Platform,
    private router: Router,
    private profileProvider: ProfileProvider,
    private walletProvider: WalletProvider,
    // private bwcErrorProvider: BwcErrorProvider,
    private platformProvider: PlatformProvider,
    private analyticsProvider: AnalyticsProvider,
    private logger: Logger,
    private events: EventManagerService,
    private persistenceProvider: PersistenceProvider,
    // private translate: TranslateService,
    private modalCtrl: ModalController,
    private actionSheetProvider: ActionSheetProvider,
    private loadingCtr: LoadingController,
    private navParams: NavParams
  ) {
    this.collapsedGroups = {};
    this.zone = new NgZone({ enableLongStackTrace: false });
  }

  getWalletGroup(name: string) {
    return this.profileProvider.getWalletGroup(name)
  }

  ionViewDidEnter() {
    this._didEnter();
  }

  ionViewWillEnter() {
    this.walletsGroups = [];
    if (this.router.getCurrentNavigation()) {
      this.navParamsData = this.router.getCurrentNavigation().extras.state ? this.router.getCurrentNavigation().extras.state : {};
    } else {
      this.navParamsData = history ? history.state : {};
    }
    if (_.isEmpty(this.navParamsData) && this.navParams && !_.isEmpty(this.navParamsData)) this.navParamsData = this.navParamsData;
    this.isDonation = this.navParamsData.isDonation;
    this.getWalletsGroups();
  }

  private getWalletsGroups() {
    const walletsGroups = this.profileProvider.orderedWalletsByGroup;
    if (this.isDonation) {
      this.walletProvider.getDonationInfo().then((data: any) => {
        this.donationSupportCoins = data.donationSupportCoins;
        this.walletsGroups = this.filterLotusDonationWallet(walletsGroups);
      });
    }
    else {
      this.walletsGroups = walletsGroups;
    }
  }

  private filterLotusDonationWallet(walletGroups: any) {
    const walletsGroup = [];
    walletGroups.forEach((el: any) => {
      const wallet = el.filter(wallet => {
        return _.some(this.donationSupportCoins, (item: any) => item.network == wallet.network && item.coin == wallet.coin);
      })
      walletsGroup.push(wallet);
    })
    this.isShowCreateNewWallet = _.isEmpty(walletsGroup) || _.isEmpty(walletsGroup[0]);
    return walletsGroup;
  }

  private async walletAudienceEvents() {
    try {
      const deviceUUID = this.platformProvider.getDeviceUUID();
      const hasCreatedWallet = await this.persistenceProvider.getHasReportedFirebaseWalletCreateFlag();
      const hasSecuredWalletFlag = await this.persistenceProvider.getHasReportedFirebaseSecuredWallet();
      const hasFundedWallet = await this.persistenceProvider.getHasReportedFirebaseHasFundedWallet();
      const hasNotFundedWallet = await this.persistenceProvider.getHasReportedFirebasedNonFundedWallet();
      const keys = await this.persistenceProvider.getKeys();

      if (!hasCreatedWallet) {
        if (keys && keys.length > 0) {
          this.analyticsProvider.logEvent('user_has_created_wallet', {
            uuid: deviceUUID,
            timestamp: Date.now()
          });
          this.persistenceProvider.setHasReportedFirebaseWalletCreateFlag();
        }
      }

      if (!hasSecuredWalletFlag) {
        let hasAtLeastOneMnemonicEncrypted = keys.some(
          key => key.mnemonicEncrypted
        );
        if (hasAtLeastOneMnemonicEncrypted) {
          this.analyticsProvider.logEvent('user_has_secured_wallet', {
            uuid: deviceUUID
          });
          this.persistenceProvider.setHasReportedFirebaseSecuredWallet();
        }
      }

      if (!hasFundedWallet) {
        let totalBalance = await this.persistenceProvider.getTotalBalance();
        if (parseFloat(totalBalance.totalBalanceAlternative)) {
          this.analyticsProvider.logEvent('user_has_funded_wallet', {
            uuid: deviceUUID
          });
          this.persistenceProvider.setHasReportedFirebaseHasFundedWallet();
        } else {
          if (!hasNotFundedWallet) {
            this.analyticsProvider.logEvent('user_has_not_funded_wallet', {
              uuid: deviceUUID
            });
            this.persistenceProvider.setHasReportedFirebaseNonFundedWallet();
          }
        }
      }
    } catch (e) {
      this.logger.debug(
        'Error occurred during wallet audience events: ' + e.message
      );
    }
  }

  private _didEnter() {
    this.updateTxps();
    this.walletAudienceEvents();
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

  ngOnInit() {
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
      this.walletsGroups.forEach(walletArray => {
        walletArray.forEach(wallet => {
          this.events.publish('Local/WalletFocus', {
            walletId: wallet.id,
            force: true
          });
        });

      });
      if (this.isDonation) {
        this.walletsGroups = this.filterLotusDonationWallet(this.walletsGroups);
      }
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

        // this.processWalletError(wallet, err);

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

  // private processWalletError(wallet, err): void {
  //   wallet.error = wallet.errorObj = null;

  //   if (!err || err == 'INPROGRESS') return;

  //   wallet.cachedStatus = null;
  //   wallet.errorObj = err;

  //   if (err.message === '403') {
  //     wallet.error = this.translate.instant('Access denied');
  //   } else if (err === 'WALLET_NOT_REGISTERED') {
  //     wallet.error = this.translate.instant('Wallet not registered');
  //   } else {
  //     wallet.error = this.bwcErrorProvider.msg(err);
  //   }
  //   this.logger.warn(
  //     this.bwcErrorProvider.msg(
  //       wallet.error,
  //       'Error updating status for ' + wallet.id
  //     )
  //   );
  // }

  public handleDonation(wallet) {
    const loading = this.loadingCtr.create({
      message: 'Please wait...'
    })
    loading.then(loadingEl => loadingEl.present());
    this.walletProvider.getDonationInfo().then((data: any) => {
      loading.then(loadingEl => loadingEl.dismiss());
      if (_.isEmpty(data)) {
        throw new Error("No data Remaning");
      }
      this.router.navigate(['/amount'], {
        state: {
          toAddress: _.get(_.find(data.donationToAddresses, item => item.coin == wallet.coin), 'address', ''),
          donationSupportCoins: data.donationSupportCoins,
          id: wallet.credentials.walletId,
          walletId: wallet.credentials.walletId,
          recipientType: 'wallet',
          name: wallet.name,
          coin: wallet.coin,
          network: wallet.network,
          isDonation: true,
          fromWalletDetails: true,
          minMoneydonation: data.minMoneydonation,
          remaining: data.remaining,
          receiveLotus: data.receiveAmountLotus,
          donationCoin: data.donationCoin
        }
      });
    }).catch((err) => {
      console.log(err)
      loading.then(loadingEl => loadingEl.dismiss());
    });
  }

  public async goToWalletDetails(wallet) {
    if (this.isDonation) {
      return this.handleDonation(wallet);
    }
    if (wallet.isComplete()) {
      this.router.navigate(['/wallet-details'], {
        state: {
          walletId: wallet.credentials.walletId
        }
      });
    } else {
      const copayerModal = await this.modalCtrl.create({
        component: CopayersPage,
        componentProps: {
          walletId: wallet.credentials.walletId
        },
        cssClass: 'wallet-details-modal'
      });
      await copayerModal.present();
    }
  }

  public openProposalsNotificationsPage(): void {
    this.router.navigate(['/proposals-notifications'], {
    })
  }

  public doRefresh(refresher): void {
    if (!this.isDonation) {
      this.debounceSetWallets();
    }
    setTimeout(() => {
      refresher.target.complete();
    }, 2000);
  }

  public settings(): void {
    this.router.navigate(['/tabs/setting'], {
    })
  }

  public collapseGroup(keyId: string) {
    this.collapsedGroups[keyId] = this.collapsedGroups[keyId] ? false : true;
  }

  public isCollapsed(keyId: string): boolean {
    return this.collapsedGroups[keyId] ? true : false;
  }

  public addWallet(keyId): void {
    this.router.navigate(['/add'], {
      state: {
        keyId
      },
    })
  }

  public openBackupPage(keyId) {
    this.router.navigate(['/backup-key'], {
      state: {
        keyId
      },
    })
  }

  public showMoreOptions(): void {
    const walletTabOptionsAction = this.actionSheetProvider.createWalletTabOptions(
      { walletsGroups: this.walletsGroups }
    );
    walletTabOptionsAction.present();
    walletTabOptionsAction.onDidDismiss(data => {
      if (data) {
        if (data.keyId) {
          this.addWallet(data.keyId)
        } else {
          this.router.navigate(['/add'], {
            state: {
              isZeroState: true
            },
          })
        }
      }
    });
  }
}



// WEBPACK FOOTER //
// ./src/pages/wallets/wallets