import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, NgZone, ViewChild, ViewEncapsulation } from '@angular/core';

import * as _ from 'lodash';
import { Subscription } from 'rxjs';

// Pages
import { CopayersPage } from '../add/copayers/copayers';

// Providers
import { ActionSheetProvider } from '../../providers/action-sheet/action-sheet';
import { AnalyticsProvider } from '../../providers/analytics/analytics';
import { Logger } from '../../providers/logger/logger';
import { PersistenceProvider } from '../../providers/persistence/persistence';
import { PlatformProvider } from '../../providers/platform/platform';
import { ProfileProvider } from '../../providers/profile/profile';
import { WalletProvider } from '../../providers/wallet/wallet';
import { LoadingController, MenuController, ModalController, NavParams, Platform } from '@ionic/angular';
import { EventManagerService } from 'src/app/providers/event-manager.service';
import { Router } from '@angular/router';
import { TokenProvider } from 'src/app/providers/token-sevice/token-sevice';
import { AddressProvider } from 'src/app/providers/address/address';
import { Token } from 'src/app/providers/currency/token';
import { AppProvider, ConfigProvider, CurrencyProvider } from 'src/app/providers';
import { DecimalFormatBalance } from 'src/app/providers/decimal-format.ts/decimal-format';

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
  public collapsedToken;

  private zone;
  private onResumeSubscription: Subscription;
  private onPauseSubscription: Subscription;
  public showReorder: boolean = false;
  public currentCurrency;
  listEToken = ['EAT', 'DoC', 'bcPro'];
  isDonation;
  donationSupportCoins = [];
  navParamsData;
  isShowCreateNewWallet = false;
  groupToken;
  currentTheme;
  totalBalanceKey;
  isShowBalance = true;
  isEditKeyName = false;
  keySelected = [];
  keyNameSelected;
  constructor(
    public http: HttpClient,
    private plt: Platform,
    private router: Router,
    private profileProvider: ProfileProvider,
    private walletProvider: WalletProvider,
    private platformProvider: PlatformProvider,
    private analyticsProvider: AnalyticsProvider,
    private logger: Logger,
    private events: EventManagerService,
    private persistenceProvider: PersistenceProvider,
    private modalCtrl: ModalController,
    private loadingCtr: LoadingController,
    private navParams: NavParams,
    private tokenProvider: TokenProvider,
    private changeDetectorRef: ChangeDetectorRef,
    private addressProvider: AddressProvider,
    private menu: MenuController,
    private appProvider: AppProvider,
    private currencyProvider: CurrencyProvider,
    private configProvider: ConfigProvider
  ) {
    if (this.router.getCurrentNavigation()) {
      this.navParamsData = this.router.getCurrentNavigation().extras.state ? this.router.getCurrentNavigation().extras.state : {};
   } else {
     this.navParamsData =  history ? history.state : undefined;
   }
    const availableChains = this.currencyProvider.getAvailableChains();
    let config = this.configProvider.get();
    this.currentCurrency = config.wallet.settings.alternativeIsoCode;
    this.currentTheme = this.appProvider.themeProvider.currentAppTheme;
    this.collapsedGroups = {};
    this.collapsedToken = {};
    this.zone = new NgZone({ enableLongStackTrace: false });
  }

  getWalletGroup(name: string) {
    return this.profileProvider.getWalletGroup(name)
  }

  ionViewDidEnter() {
    this._didEnter();
  }

  async loadItemTokenWallet(wallet, j) {
    const groupToken = await this.tokenProvider.getTokens(wallet);
    if (!_.isEmpty(groupToken)) {
      this.keySelected[j].tokens = groupToken ;
      this.profileProvider.setTokensWallet(this.keySelected[j].id, groupToken);
    }
  }

  public reloadToken(loading, wallet, j) {
    setTimeout(() => {
      try {
        this.loadItemTokenWallet(wallet, j); // loading in true
        loading.target.complete();
      } catch {
        loading.target.complete();
      }
    }, 300);
  }

  goToTokenDetails(wallet, token: Token) {
    this.router.navigate(['/token-details'], {
      state: {
        walletId: wallet.credentials.walletId,
        token: token
      }
    });
  }

  setIconToken(token) {
    const isValid = this.listEToken.includes(token?.tokenInfo?.symbol);
    return isValid ? `assets/img/currencies/${token?.tokenInfo?.symbol}.svg` : 'assets/img/currencies/xec.svg';
  }

  async ionViewWillEnter() {
    this.walletsGroups = [];
    if (this.router.getCurrentNavigation()) {
      this.navParamsData = this.router.getCurrentNavigation().extras.state ? this.router.getCurrentNavigation().extras.state : {};
    } else {
      this.navParamsData = history ? history.state : {};
    }
    if (_.isEmpty(this.navParamsData) && this.navParams && !_.isEmpty(this.navParamsData)) this.navParamsData = this.navParamsData;
    this.isDonation = this.navParamsData.isDonation;
    this.getWalletsGroups();
    this.initKeySelected();
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
      this.loadTokenDataToken(walletsGroups).then(data => {
        this.walletsGroups = data;
        this.changeDetectorRef.detectChanges();
      }).catch(err => {
        this.walletsGroups = walletsGroups;
        this.logger.error(err);
      })
    }
  }

  openMenu() {
    this.menu.open('first');
  }

  closeMenu() {
    this.menu.close('first');
  }

  public async reorderAccounts(indexes) {
    const element = this.walletsGroups[indexes.detail.from];
    this.walletsGroups.splice(indexes.detail.from, 1);
    this.walletsGroups.splice(indexes.detail.to, 0, element);
    _.each(this.walletsGroups, (walletGroup, index: number) => {
      this.profileProvider.setWalletGroupOrder(walletGroup[0].keyId, index);
    });
    this.profileProvider.setOrderedWalletsByGroup();
    indexes.detail.complete();
  }

  private initKeySelected() {
    let keyChange = this.profileProvider.keyChange;
    let walletChange = this.profileProvider.walletChange;
    if (this.walletsGroups.length !== 0) {
      if (this.keySelected.length === 0 || keyChange.isDelete) {
        this.totalBalanceKey = this.getTotalBalanceKey(this.walletsGroups[0]);
        this.keySelected = this.walletsGroups[0];
        this.keyNameSelected = this.getWalletGroup(this.keySelected[0].keyId).name;
        this.profileProvider.keyChange.isDelete = false;
      }
      if (keyChange.isStatus && keyChange.keyId) {
        const walletsGroups = this.profileProvider.orderedWalletsByGroup;
        const newAddWallet = walletsGroups.find((item) => {
          return item[0].keyId == keyChange.keyId;
        })
        this.totalBalanceKey = this.getTotalBalanceKey(newAddWallet);
        this.keySelected = newAddWallet;
        this.keyNameSelected = this.getWalletGroup(this.keySelected[0].keyId).name;
        this.profileProvider.keyChange.isStatus = false;
      }
      if (walletChange.isStatus && walletChange.keyId) {
        const walletsGroups = this.profileProvider.orderedWalletsByGroup;
        const newAddWallet = walletsGroups.find((item) => {
          return item[0].keyId == walletChange.keyId;
        })
        this.totalBalanceKey = this.getTotalBalanceKey(newAddWallet);
        this.keySelected = newAddWallet;
        this.keyNameSelected = this.getWalletGroup(this.keySelected[0].keyId).name;
        this.profileProvider.walletChange.isStatus = false;
      }
    } else {
      this.keySelected = [];
      this.walletsGroups = [];
    }
  }

  public openWalletGroupSettings(keyId: string): void {
    this.router.navigate(['/key-settings'], {
      state: {
        keyId: keyId
      }
    });
  }

  public editKeyName(){
    this.isEditKeyName = false;
  }

  public getKeySelected(keyId) {
    this.keySelected = this.profileProvider.getWalletsFromGroup({keyId: keyId});
    this.keyNameSelected = this.getWalletGroup(this.keySelected[0].keyId).name;
    this.totalBalanceKey = this.getTotalBalanceKey(this.keySelected);
  }

  private getTotalBalanceKey(key) {
    const totalBalanceAlternative = key.reduce((result, wallet) => {
      if(wallet.cachedStatus && wallet.cachedStatus.totalBalanceAlternative && wallet.network !== 'testnet'){
          result += parseFloat(wallet.cachedStatus.totalBalanceAlternative);
      }
      return result;
    }, 0)
    return DecimalFormatBalance(totalBalanceAlternative);
  }

  public DecimalFormatBalance(amount) {
    return DecimalFormatBalance(amount);
  }

  public addKey(): void {
    this.router.navigate(['/add'], {
      state: {
        isZeroState: true
      },
    })
  }

  public openProposalsNotificationsPage(): void {
    this.router.navigate(['/proposals-notifications']);
  }

  loadEtokenAddress(wallet) {
    return this.profileProvider.setAddress(wallet).then(addr => {
      if (!addr) return '';
      const { prefix, type, hash } = this.addressProvider.decodeAddress(addr);
      const etoken = this.addressProvider.encodeAddress('etoken', type, hash, addr);
      return Promise.resolve(etoken);
    })
  }


  isSupportToken(wallet): boolean {
    if (wallet && wallet.coin == 'xec' && wallet.isSlpToken) return true;
    return false
  }

  setTokensWallet(walletId, groupToken) {
    return new Promise(resolve => {
      this.profileProvider.setTokensWallet(walletId, groupToken) ;
      resolve(true)
    });
  }

  async loadTokenDataToken(walletsGroups) {
    for (var i = 0; i < walletsGroups.length; i++) {
      const walletsGroup = walletsGroups[i];
      for (var j = 0; j < walletsGroup.length; j++) {
        const wallet = walletsGroup[j]
        if (this.isSupportToken(wallet)) {
          const etokenAddress = await this.loadEtokenAddress(wallet)
          if (etokenAddress) walletsGroups[i][j].etokenAddress = etokenAddress
          const groupToken = await this.tokenProvider.getTokens(wallet);
          if (!_.isEmpty(groupToken)) {
            walletsGroups[i][j].tokens = groupToken;
            await this.setTokensWallet(walletsGroups[i][j].id, groupToken)
          }
        }
      }
    }
    return walletsGroups;
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

  private walletGetDataHandler = opts => {
    this.logger.debug('RECV Local/GetData @home', opts);
    if (opts) {
      this.getWalletsGroups();
      this.initKeySelected();
    }
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

      this.events.subscribe('Local/GetData', this.walletGetDataHandler);
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
      } else {
        this.loadTokenDataToken(this.walletsGroups).then(data => {
          this.walletsGroups = data;
          this.changeDetectorRef.detectChanges();
        })
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

  public doRefresh(refresher): void {
    if (!this.isDonation) {
      this.debounceSetWallets();
    }
    setTimeout(() => {
      refresher.target.complete();
    }, 2000);
  }

  public collapsToken(walletId: string) {
    this.collapsedToken[walletId] = this.collapsedToken[walletId] ? false : true;
  }

  public isCollapsedToken(walletId: string): boolean {
    return this.collapsedToken[walletId] ? true : false;
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

  public openSettingPage() {
    this.router.navigate(['/setting']);
  }

  public openAddressBookPage() {
    this.router.navigate(['/addressbook']);
  }
}



// WEBPACK FOOTER //
// ./src/pages/wallets/wallets