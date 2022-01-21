import { Component, NgZone, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events, NavController, Platform } from 'ionic-angular';

import { ActionSheetProvider } from '../../providers/action-sheet/action-sheet';
import { AnalyticsProvider } from '../../providers/analytics/analytics';
import { AppProvider } from '../../providers/app/app';
import { BwcErrorProvider } from '../../providers/bwc-error/bwc-error';
import { ClipboardProvider } from '../../providers/clipboard/clipboard';
import { LocationProvider } from '../../providers/location/location';
import { Logger } from '../../providers/logger/logger';
import {
  Network,
  PersistenceProvider
} from '../../providers/persistence/persistence';
import { PlatformProvider } from '../../providers/platform/platform';
import { ProfileProvider } from '../../providers/profile/profile';
import { RateProvider } from '../../providers/rate/rate';
import { TabProvider } from '../../providers/tab/tab';
import { ThemeProvider } from '../../providers/theme/theme';
import { WalletProvider } from '../../providers/wallet/wallet';

import { CardsPage } from '../cards/cards';
import { CoinAndWalletSelectorPage } from '../coin-and-wallet-selector/coin-and-wallet-selector';
import { ExchangeCryptoPage } from '../exchange-crypto/exchange-crypto';
import { HomePage } from '../home/home';
import { CardCatalogPage } from '../integrations/gift-cards/card-catalog/card-catalog';
import { ScanPage } from '../scan/scan';
import { AmountPage } from '../send/amount/amount';
import { SettingsPage } from '../settings/settings';
import { WalletsPage } from '../wallets/wallets';

import * as _ from 'lodash';
import { Subscription } from 'rxjs';

interface UpdateWalletOptsI {
  walletId: string;
  force?: boolean;
  alsoUpdateHistory?: boolean;
  checkTxsConfirmations?: boolean;
}
@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {
  appName: string;
  @ViewChild('tabs')
  tabs;
  NETWORK = 'livenet';
  public txpsN: number;
  public clipboardBadge: number;
  public clipboardData: string;
  public cardNotificationBadgeText;
  public scanIconType: string;
  public isCordova: boolean;
  public navigationType: string;
  private zone;
  private hasConnectionError: boolean;

  private onResumeSubscription: Subscription;
  private onPauseSubscription: Subscription;
  private pageMap = {
    AmountPage,
    ExchangeCryptoPage,
    CoinAndWalletSelectorPage,
    CardCatalogPage,
    ScanPage
  };

  constructor(
    private plt: Platform,
    private appProvider: AppProvider,
    private profileProvider: ProfileProvider,
    private logger: Logger,
    private walletProvider: WalletProvider,
    private events: Events,
    private persistenceProvider: PersistenceProvider,
    private translate: TranslateService,
    private bwcErrorProvider: BwcErrorProvider,
    private tabProvider: TabProvider,
    private rateProvider: RateProvider,
    private platformProvider: PlatformProvider,
    private locationProvider: LocationProvider,
    private actionSheetProvider: ActionSheetProvider,
    private navCtrl: NavController,
    private analyticsProvider: AnalyticsProvider,
    private themeProvider: ThemeProvider,
    private clipboardProvider: ClipboardProvider
  ) {
    this.persistenceProvider.getNetwork().then((network: string) => {
      if (network) {
        this.NETWORK = network;
      }
      this.logger.log(`tabs initialized with ${this.NETWORK}`);
    });

    this.zone = new NgZone({ enableLongStackTrace: false });
    this.logger.info('Loaded: TabsPage');
    this.appName = this.appProvider.info.nameCase;
    this.isCordova = this.platformProvider.isCordova;
    this.scanIconType =
      this.appName == 'BitPay' ? 'tab-scan' : 'tab-copay-scan';
    this.navigationType = this.themeProvider.getSelectedNavigationType();

    if (this.platformProvider.isElectron) {
      this.updateDesktopOnFocus();
    }

    this.persistenceProvider.getCardExperimentFlag().then(status => {
      if (status === 'enabled') {
        this.persistenceProvider
          .getCardNotificationBadge()
          .then(badgeStatus => {
            this.cardNotificationBadgeText =
              badgeStatus === 'disabled' ? null : 'New';
          });
      }
    });
  }

  private subscribeEvents() {
    this.events.subscribe('experimentUpdateStart', () => {
      this.tabs.select(2);
    });
    this.events.subscribe('bwsEvent', this.bwsEventHandler);
    this.events.subscribe('Local/UpdateTxps', data => {
      this.setTxps(data);
    });
    this.events.subscribe(
      'Local/FetchWallets',
      (
        opts: { alsoUpdateHistory: boolean; force: boolean } = {
          alsoUpdateHistory: true,
          force: true
        }
      ) => {
        this.fetchAllWalletsStatus(opts);
      }
    );
    this.events.subscribe('Local/UpdateNavigationType', () => {
      this.navigationType = this.themeProvider.getSelectedNavigationType();
    });
    this.events.subscribe('Local/WalletFocus', opts => {
      opts = opts || {};
      this.fetchWalletStatus(opts);
      this.updateTxps();
    });
  }

  private unsubscribeEvents() {
    this.events.unsubscribe('bwsEvent');
    this.events.unsubscribe('Local/UpdateTxps');
    this.events.unsubscribe('Local/FetchWallets');
    this.events.unsubscribe('Local/UpdateNavigationType');
    this.events.unsubscribe('experimentUpdateStart');
    this.events.unsubscribe('Local/WalletFocus');
  }

  ngOnInit() {
    this.subscribeEvents();
    this.onResumeSubscription = this.plt.resume.subscribe(() => {
      this.subscribeEvents();
      setTimeout(() => {
        this.updateTxps();
        this.fetchAllWalletsStatus();
      }, 1000);
    });

    this.onPauseSubscription = this.plt.pause.subscribe(() => {
      this.unsubscribeEvents();
    });

    this.checkCardEnabled();
    if (this.platformProvider.isElectron) {
      this.checkClipboardData();
    }
    this.tabProvider.prefetchGiftCards();
  }

  ngOnDestroy() {
    this.onResumeSubscription.unsubscribe();
    this.onPauseSubscription.unsubscribe();
    this.unsubscribeEvents();
  }

  private async checkCardEnabled() {
    let cardExperimentEnabled =
      (await this.persistenceProvider.getCardExperimentFlag()) === 'enabled';

    const cards = await this.persistenceProvider.getBitpayDebitCards(
      Network[this.NETWORK]
    );

    if (!cardExperimentEnabled) {
      try {
        this.logger.debug('BitPay: setting country');
        const country = await this.locationProvider.getCountry();
        if (country === 'US') {
          this.logger.debug('If US: Set Card Experiment Flag Enabled');
          await this.persistenceProvider.setCardExperimentFlag('enabled');
          cardExperimentEnabled = true;
        }
      } catch (err) {
        this.logger.error('Error setting country: ', err);
      }
    }

    // set banner advertisement in home.ts
    this.events.publish('CardAdvertisementUpdate', {
      status: cards ? 'connected' : null,
      cardExperimentEnabled,
      cards
    });
  }

  disableCardNotificationBadge() {
    this.persistenceProvider.getCardExperimentFlag().then(status => {
      if (status === 'enabled') {
        this.cardNotificationBadgeText = null;
        this.persistenceProvider.setCardNotificationBadge('disabled');
      }
    });
  }

  updateTxps() {
    this.profileProvider.getTxps({ limit: 3 }).then(data => {
      this.setTxps(data);
    });
  }

  setTxps(data) {
    this.zone.run(() => {
      this.txpsN = data.n;
    });
  }

  private updateDesktopOnFocus() {
    const { remote } = (window as any).require('electron');
    const win = remote.getCurrentWindow();
    win.on('focus', () => {
      this.events.publish('Desktop/onFocus');
      this.checkClipboardData();
      setTimeout(() => {
        this.updateTxps();
        this.fetchAllWalletsStatus();
      }, 1000);
    });
  }

  private async checkClipboardData(): Promise<void> {
    this.clipboardData = await this.clipboardProvider.getValidData();
    this.clipboardBadge = this.clipboardData ? 1 : 0;
  }

  private bwsEventHandler: any = data => {
    // NewCopayer, WalletComplete, NewTxProposal, NewOutgoingTx, NewIncomingTx,
    // TxProposalFinallyRejected, TxConfirmation, NewAddress, NewBlock, TxProposalAcceptedBy,
    // TxProposalFinallyAccepted, TxProposalRejectedBy, TxProposalRemoved
    // TODO: NewCopayer, WalletComplete
    const wallet = this.profileProvider.getWallet(data.walletId);

    if (_.isNil(wallet) && data.notification_type != 'NewBlock') return;

    this.logger.info(
      `BWS Event: ${data.notification_type}: `,
      JSON.stringify(data.notification)
    );

    switch (data.notification_type) {
      case 'NewAddress':
        this.walletProvider.expireAddress(data.walletId);
        break;
      case 'NewBlock':
        if (data.notification.coin && data.notification.network) {
          const opts = {
            coin: data.notification.coin,
            network: data.notification.network,
            showHidden: false,
            alsoUpdateHistory: false,
            force: true,
            checkTxsConfirmations: true
          };
          this.fetchAllWalletsStatus(opts);
        }
        break;
      case 'TxProposalAcceptedBy':
      case 'TxProposalRejectedBy':
      case 'TxProposalRemoved':
        this.updateTxps();
        break;
      case 'NewOutgoingTx':
      case 'NewIncomingTx':
      case 'NewTxProposal':
      case 'TxConfirmation':
        this.fetchWalletStatus({
          walletId: data.walletId,
          force: true,
          alsoUpdateHistory: true
        });
        this.updateTxps();
        break;
    }
  };

  private updateTotalBalance(wallets) {
    this.rateProvider.getLastDayRates().then(lastDayRatesArray => {
      this.walletProvider
        .getTotalAmount(wallets, lastDayRatesArray)
        .then(data => {
          this.logger.debug('Total Balance and Price Updated');
          this.events.publish('Local/HomeBalance', data);
          this.events.publish('Local/PriceUpdate');
        });
    });
  }

  private processWalletError(wallet, err): void {
    wallet.error = wallet.errorObj = null;

    if (!err || err == 'INPROGRESS') return;

    wallet.cachedStatus = null;
    wallet.errorObj = err;

    if (err.message === '403') {
      this.events.publish('Local/AccessDenied');
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

  private connectionError = _.debounce(
    async () => {
      this.events.publish('Local/ConnectionError');
    },
    5000,
    {
      leading: false
    }
  );

  private fetchAllWalletsStatus = _.debounce(
    async (opts?) => {
      this._fetchAllWallets(opts);
    },
    5000,
    {
      leading: true
    }
  );

  private _fetchAllWallets(opts) {
    this.hasConnectionError = false;

    this.profileProvider.setLastKnownBalance();
    opts = opts || {};
    opts.showHidden = false;
    opts.onlyComplete = true;
    opts.backedUp = true;
    let wallets = this.profileProvider.getWallets(opts);
    if (_.isEmpty(wallets)) {
      if (!opts.coin) {
        this.events.publish('Local/HomeBalance');
      }
      return;
    }

    this.logger.debug('Fetching All Wallets and Updating Total Balance');

    const promises = [];
    _.each(wallets, wallet => {
      promises.push(
        this.fetchWalletStatus({
          walletId: wallet.credentials.walletId,
          alsoUpdateHistory: opts.alsoUpdateHistory,
          force: opts.force,
          checkTxsConfirmations: opts.checkTxsConfirmations
        })
      );
    });

    Promise.all(promises).then(() => {
      if (!this.hasConnectionError && !opts.coin) {
        this.updateTotalBalance(wallets);
      }
      this.updateTxps();
    });
  }

  public openFooterMenu(): void {
    if (this.navigationType !== 'transact') return;

    this.analyticsProvider.logEvent('transaction_menu_clicked', {
      from: 'tabs'
    });
    const footerMenu = this.actionSheetProvider.createFooterMenu({
      clipboardData: this.clipboardData
    });
    footerMenu.present();
    footerMenu.onDidDismiss(nextView => {
      if (nextView) {
        if (nextView.name) {
          this.navCtrl.push(this.pageMap[nextView.name], nextView.params, {
            animate: !['ScanPage'].includes(nextView.name)
          });
        } else {
          this.clipboardProvider.redir(this.clipboardData);
          this.checkClipboardData();
        }
      }
    });
  }

  private fetchWalletStatus = (opts: UpdateWalletOptsI): Promise<void> => {
    return new Promise(resolve => {
      if (!opts.walletId) {
        this.logger.error('Error no walletId in update Wallet');
        return resolve();
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
      if (!wallet) return resolve();

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

          this.events.publish('Local/WalletUpdate', {
            walletId: opts.walletId,
            finished: true
          });

          // Update only wallets that have unconfirmed txs when NewBlock push notification is received
          if (opts.checkTxsConfirmations && wallet.completeHistory) {
            for (let tx of wallet.completeHistory.slice(0, 5)) {
              if (tx.confirmations === 0) {
                opts.alsoUpdateHistory = true;
                break;
              }
            }
          }

          if (opts.alsoUpdateHistory) {
            this.fetchTxHistory(opts);
          }

          return resolve();
        })
        .catch(err => {
          if (err == 'INPROGRESS') return resolve();

          this.logger.warn('Update error:', err);

          this.processWalletError(wallet, err);
          if (err && err.message == 'Wallet service connection error.') {
            this.hasConnectionError = true;
            this.connectionError();
          }

          this.events.publish('Local/WalletUpdate', {
            walletId: opts.walletId,
            finished: true,
            error: wallet.error
          });

          if (opts.alsoUpdateHistory) {
            this.fetchTxHistory(opts);
          }
          return resolve();
        });
    });
  };

  private fetchTxHistory(opts: UpdateWalletOptsI) {
    if (!opts.walletId) {
      this.logger.error('Error no walletId in update History');
      return;
    }
    const wallet = this.profileProvider.getWallet(opts.walletId);
    if (!wallet) return;

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

  homeRoot = HomePage;
  walletsRoot = WalletsPage;
  scanRoot = ScanPage;
  cardsRoot = CardsPage;
  settingsRoot = SettingsPage;
}
