import { Component, NgZone } from '@angular/core';
import { SocialSharing } from '@ionic-native/social-sharing';
import { TranslateService } from '@ngx-translate/core';
import {
  Events,
  ModalController,
  NavController,
  NavParams,
  Platform,
  ViewController
} from 'ionic-angular';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import env from '../../environments';

// providers
import { AddressBookProvider } from '../../providers/address-book/address-book';
import { AnalyticsProvider } from '../../providers/analytics/analytics';
import { BuyCryptoProvider } from '../../providers/buy-crypto/buy-crypto';
import { BwcErrorProvider } from '../../providers/bwc-error/bwc-error';
import { ConfigProvider } from '../../providers/config/config';
import { CurrencyProvider } from '../../providers/currency/currency';
import { ErrorsProvider } from '../../providers/errors/errors';
import { ExchangeCryptoProvider } from '../../providers/exchange-crypto/exchange-crypto';
import { ExternalLinkProvider } from '../../providers/external-link/external-link';
import { GiftCardProvider } from '../../providers/gift-card/gift-card';
import { CardConfigMap } from '../../providers/gift-card/gift-card.types';
import { ActionSheetProvider, AppProvider } from '../../providers/index';
import { LocationProvider } from '../../providers/location/location';
import { Logger } from '../../providers/logger/logger';
import { PersistenceProvider } from '../../providers/persistence/persistence';
import { PlatformProvider } from '../../providers/platform/platform';
import { ProfileProvider } from '../../providers/profile/profile';
import { ThemeProvider } from '../../providers/theme/theme';
import { TimeProvider } from '../../providers/time/time';
import { WalletProvider } from '../../providers/wallet/wallet';

// pages
import { BackupKeyPage } from '../../pages/backup/backup-key/backup-key';
import { ExchangeCryptoPage } from '../../pages/exchange-crypto/exchange-crypto';
import { SendPage } from '../../pages/send/send';
import { WalletAddressesPage } from '../../pages/settings/wallet-settings/wallet-settings-advanced/wallet-addresses/wallet-addresses';
import { TxDetailsModal } from '../../pages/tx-details/tx-details';
import { ProposalsNotificationsPage } from '../../pages/wallets/proposals-notifications/proposals-notifications';
import { AmountPage } from '../send/amount/amount';
import { SearchTxModalPage } from './search-tx-modal/search-tx-modal';
import { WalletBalanceModal } from './wallet-balance/wallet-balance';

const HISTORY_SHOW_LIMIT = 10;
const MIN_UPDATE_TIME = 2000;
const TIMEOUT_FOR_REFRESHER = 1000;

@Component({
  selector: 'page-wallet-details',
  templateUrl: 'wallet-details.html'
})
export class WalletDetailsPage {
  private currentPage: number = 0;
  private showBackupNeededMsg: boolean = true;
  private onResumeSubscription: Subscription;
  private analyzeUtxosDone: boolean;
  private zone;
  private blockexplorerUrl: string;
  private blockexplorerUrlTestnet: string;

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
  public addressbook = [];
  public txps = [];
  public txpsPending: any[];
  public lowUtxosWarning: boolean;
  public associatedWallet: string;
  public backgroundColor: string;
  private isCordova: boolean;
  public useLegacyQrCode: boolean;
  public isDarkModeEnabled: boolean;
  public showBuyCrypto: boolean;
  public showExchangeCrypto: boolean;
  public multisigPendingWallets: any[] = [];
  public multisigContractInstantiationInfo: any[];

  public supportedCards: Promise<CardConfigMap>;
  constructor(
    public currencyProvider: CurrencyProvider,
    private navParams: NavParams,
    private navCtrl: NavController,
    private walletProvider: WalletProvider,
    private addressbookProvider: AddressBookProvider,
    private events: Events,
    public giftCardProvider: GiftCardProvider,
    private logger: Logger,
    private timeProvider: TimeProvider,
    private translate: TranslateService,
    private modalCtrl: ModalController,
    private externalLinkProvider: ExternalLinkProvider,
    private actionSheetProvider: ActionSheetProvider,
    private platform: Platform,
    private profileProvider: ProfileProvider,
    private viewCtrl: ViewController,
    private platformProvider: PlatformProvider,
    private socialSharing: SocialSharing,
    private bwcErrorProvider: BwcErrorProvider,
    private errorsProvider: ErrorsProvider,
    private themeProvider: ThemeProvider,
    private configProvider: ConfigProvider,
    private analyticsProvider: AnalyticsProvider,
    private buyCryptoProvider: BuyCryptoProvider,
    private exchangeCryptoProvider: ExchangeCryptoProvider,
    private appProvider: AppProvider,
    private persistenceProvider: PersistenceProvider,
    private locationProvider: LocationProvider
  ) {
    this.zone = new NgZone({ enableLongStackTrace: false });
    this.isCordova = this.platformProvider.isCordova;

    this.wallet = this.profileProvider.getWallet(this.navParams.data.walletId);
    this.supportedCards = this.giftCardProvider.getSupportedCardMap();
    this.useLegacyQrCode = this.configProvider.get().legacyQrCode.show;
    this.isDarkModeEnabled = this.themeProvider.isDarkModeEnabled();
    this.showBuyCrypto =
      _.includes(
        this.buyCryptoProvider.exchangeCoinsSupported,
        this.wallet.coin
      ) &&
      !['xrp'].includes(this.wallet.coin) &&
      (this.wallet.network == 'livenet' ||
        (this.wallet.network == 'testnet' && env.name == 'development'));

    if (
      _.includes(
        this.exchangeCryptoProvider.exchangeCoinsSupported,
        this.wallet.coin
      )
    ) {
      this.showExchangeCrypto =
        this.wallet.network == 'livenet' && !['xrp'].includes(this.wallet.coin)
          ? true
          : false;
    }

    if (!this.showExchangeCrypto || !this.showBuyCrypto) {
      this.locationProvider.getCountry().then(country => {
        if (!this.showBuyCrypto) {
          if (
            country != 'US' &&
            this.wallet.network == 'livenet' &&
            ['xrp'].includes(this.wallet.coin)
          ) {
            this.showBuyCrypto = true;
          }
        }

        if (!this.showExchangeCrypto) {
          if (
            country != 'US' &&
            this.wallet.network == 'livenet' &&
            ['xrp'].includes(this.wallet.coin)
          ) {
            this.showExchangeCrypto = true;
          } else {
            const opts = { country };
            this.exchangeCryptoProvider
              .checkServiceAvailability('1inch', opts)
              .then(isAvailable => {
                if (isAvailable) {
                  this.showExchangeCrypto =
                    this.currencyProvider.isERCToken(this.wallet.coin) &&
                    this.wallet.network == 'livenet'
                      ? true
                      : false;
                }
              })
              .catch(err => {
                if (err) this.logger.error(err);
              });
          }
        }
      });
    }

    // Getting info from cache
    if (this.navParams.data.clearCache) {
      this.clearHistoryCache();
    } else {
      if (this.wallet.completeHistory) this.showHistory();
      else {
        this.events.publish('Local/WalletFocus', {
          walletId: this.wallet.credentials.walletId,
          force: true,
          alsoUpdateHistory: true
        });
      }
    }

    this.requiresMultipleSignatures = this.wallet.credentials.m > 1;

    this.addressbookProvider
      .list(this.wallet.network)
      .then(ab => {
        this.addressbook = ab;
      })
      .catch(err => {
        this.logger.error(err);
      });

    let defaults = this.configProvider.getDefaults();
    this.blockexplorerUrl = defaults.blockExplorerUrl[this.wallet.coin];
    this.blockexplorerUrlTestnet =
      defaults.blockExplorerUrlTestnet[this.wallet.coin];
  }

  subscribeEvents() {
    this.events.subscribe('Local/WalletUpdate', this.updateStatus);
    this.events.subscribe('Local/WalletHistoryUpdate', this.updateHistory);
  }

  ionViewDidLoad() {
    this.onResumeSubscription = this.platform.resume.subscribe(() => {
      this.profileProvider.setFastRefresh(this.wallet);
      this.subscribeEvents();
    });
    this.backgroundColor = this.themeProvider.getThemeInfo().walletDetailsBackgroundStart;
    this.profileProvider.setFastRefresh(this.wallet);
    this.events.publish('Local/WalletFocus', {
      walletId: this.wallet.credentials.walletId,
      force: true,
      alsoUpdateHistory: true
    });
    this.subscribeEvents();
    this.checkIfEthMultisigPendingInstantiation();
  }

  ionViewWillLeave() {
    this.profileProvider.setSlowRefresh(this.wallet);
  }

  ngOnDestroy() {
    this.events.unsubscribe('Local/WalletUpdate');
    this.events.unsubscribe('Local/WalletHistoryUpdate');
    this.onResumeSubscription.unsubscribe();
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

  public isUtxoCoin(): boolean {
    return this.currencyProvider.isUtxoCoin(this.wallet.coin);
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

  private showHistory(loading?: boolean) {
    if (!this.wallet.completeHistory) return;

    this.history = this.wallet.completeHistory.slice(
      0,
      (this.currentPage + 1) * HISTORY_SHOW_LIMIT
    );
    this.zone.run(() => {
      this.groupedHistory = this.groupHistory(this.history);
    });
    if (loading) this.currentPage++;
  }

  private setPendingTxps(txps) {
    this.txps = !txps ? [] : _.sortBy(txps, 'createdOn').reverse();
    this.txpsPending = [];
    this.txps.forEach(txp => {
      const action: any = _.find(txp.actions, {
        copayerId: txp.wallet.copayerId
      });

      if ((!action || action.type === 'failed') && txp.status == 'pending') {
        this.txpsPending.push(txp);
      }

      // For unsent transactions
      if (action && txp.status == 'accepted') {
        this.txpsPending.push(txp);
      }
    });
  }

  public openProposalsNotificationsPage(): void {
    if (this.wallet.credentials.multisigEthInfo) {
      this.navCtrl.push(ProposalsNotificationsPage, {
        multisigContractAddress: this.wallet.credentials.multisigEthInfo
          .multisigContractAddress
      });
    } else {
      this.navCtrl.push(ProposalsNotificationsPage, {
        walletId: this.wallet.id
      });
    }
  }

  private updateAll = _.debounce(
    () => {
      this.events.publish('Local/WalletFocus', {
        walletId: this.wallet.credentials.walletId,
        force: true,
        alsoUpdateHistory: true
      });
    },
    MIN_UPDATE_TIME,
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
    if (
      this.history &&
      this.wallet.completeHistory &&
      this.history.length === this.wallet.completeHistory.length
    ) {
      loading.complete();
      return;
    }
    setTimeout(() => {
      this.showHistory(true); // loading in true
      loading.complete();
    }, 300);
  }

  private analyzeUtxos(): void {
    if (this.analyzeUtxosDone) return;

    this.walletProvider
      .getLowUtxos(this.wallet)
      .then(resp => {
        if (!resp) return;
        this.analyzeUtxosDone = true;
        this.lowUtxosWarning = !!resp.warning;
        // this.logger.debug('Low UTXOs warning: ', this.lowUtxosWarning);
      })
      .catch(err => {
        this.logger.warn('Analyze UTXOs: ', err);
      });
  }

  // no network //
  private updateHistory = opts => {
    this.logger.debug('RECV Local/WalletHistoryUpdate @walletDetails', opts);
    if (opts.walletId != this.wallet.id) return;

    if (opts.finished) {
      this.updatingTxHistoryProgress = 0;
      this.updatingTxHistory = false;
      this.updateTxHistoryError = false;

      const hasTx = !!this.wallet.completeHistory[0];

      this.showNoTransactionsYetMsg = !hasTx;

      if (this.wallet.needsBackup && hasTx && this.showBackupNeededMsg)
        this.openBackupModal();

      this.events.publish('Local/WalletFocus', {
        walletId: this.wallet.credentials.walletId,
        force: true
      });

      this.showHistory();
    } else {
      if (opts.error) {
        this.updatingTxHistory = false;
        this.updateTxHistoryError = true;

        // show what we have.
        this.showHistory();
      } else {
        this.updatingTxHistory = true;
        this.updatingTxHistoryProgress = opts.progress;
        this.updateTxHistoryError = false;

        // show what we have
        this.showHistory();

        // Hide prev history if long downlad is happending...
        //  if (opts.progress > 5) {
        //  this.history = null;
        //  }
      }
    }
  };

  // no network //
  private updateStatus = opts => {
    if (opts.walletId != this.wallet.id) return;
    this.logger.debug('RECV Local/WalletUpdate @walletDetails', opts);

    if (!opts.finished) {
      this.updatingStatus = true;
      return;
    }

    this.updatingStatus = false;

    if (!this.wallet.error) {
      this.logger.debug(
        ' Updating wallet with amount ',
        this.wallet.cachedStatus.balance.totalAmount
      );
      let status = this.wallet.cachedStatus;
      this.setPendingTxps(status.pendingTxps);
      this.showBalanceButton = status.totalBalanceSat != status.spendableAmount;

      const minXrpBalance = 20000000; // 20 XRP * 1e6
      if (this.wallet.coin === 'xrp') {
        this.showBalanceButton =
          status.totalBalanceSat &&
          status.totalBalanceSat != status.spendableAmount + minXrpBalance;
      }

      if (this.isUtxoCoin()) {
        this.analyzeUtxos();
      }

      this.updateStatusError = null;
      this.walletNotRegistered = false;
    } else {
      this.showBalanceButton = false;

      let err = this.wallet.errorObj;
      if (err.name && err.name.match(/WALLET_NOT_FOUND/)) {
        this.walletNotRegistered = true;
      }
      if (err === 'WALLET_NOT_REGISTERED') {
        this.walletNotRegistered = true;
      } else {
        this.updateStatusError = this.wallet.errorObj;
      }
    }
  };

  public itemTapped(tx) {
    if (
      tx.hasUnconfirmedInputs &&
      (tx.action === 'received' || tx.action === 'moved') &&
      this.wallet.coin == 'btc'
    ) {
      const infoSheet = this.actionSheetProvider.createInfoSheet(
        'unconfirmed-inputs'
      );
      infoSheet.present();
      infoSheet.onDidDismiss(() => {
        this.goToTxDetails(tx);
      });
    } else if (
      tx.isRBF &&
      tx.action === 'received' &&
      this.wallet.coin == 'btc'
    ) {
      const infoSheet = this.actionSheetProvider.createInfoSheet('rbf-tx');
      infoSheet.present();
      infoSheet.onDidDismiss(option => {
        option ? this.speedUpTx(tx) : this.goToTxDetails(tx);
      });
    } else if (this.canSpeedUpTx(tx)) {
      const name =
        this.wallet.coin === 'eth' ||
        this.currencyProvider.isERCToken(this.wallet.coin)
          ? 'speed-up-eth-tx'
          : 'speed-up-tx';
      const infoSheet = this.actionSheetProvider.createInfoSheet(name);
      infoSheet.present();
      infoSheet.onDidDismiss(option => {
        option ? this.speedUpTx(tx) : this.goToTxDetails(tx);
      });
    } else {
      this.goToTxDetails(tx);
    }
  }

  private speedUpTx(tx) {
    this.walletProvider.getAddress(this.wallet, false).then(addr => {
      const data = {
        amount: 0,
        network: this.wallet.network,
        coin: this.wallet.coin,
        speedUpTx: true,
        toAddress: this.wallet.coin === 'eth' ? tx.addressTo : addr,
        walletId: this.wallet.credentials.walletId,
        fromWalletDetails: true,
        txid: tx.txid,
        recipientType: 'wallet',
        name:
          this.wallet.coin === 'eth' && tx.customData
            ? tx.customData.toWalletName
            : this.wallet.name,
        nonce: tx.nonce,
        data: tx.data,
        gasLimit: tx.gasLimit,
        customData: tx.customData
      };
      const nextView = {
        name: 'ConfirmPage',
        params: data
      };
      this.events.publish('IncomingDataRedir', nextView);
    });
  }

  public goToTxDetails(tx) {
    const txDetailModal = this.modalCtrl.create(TxDetailsModal, {
      walletId: this.wallet.credentials.walletId,
      txid: tx.txid
    });
    txDetailModal.present();
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
    this.navCtrl.push(BackupKeyPage, {
      keyId: this.wallet.credentials.keyId
    });
  }

  public openAddresses() {
    this.navCtrl.push(WalletAddressesPage, {
      walletId: this.wallet.credentials.walletId
    });
  }

  public getDate(txCreated) {
    const date = new Date(txCreated * 1000);
    return date;
  }

  public trackByFn(index) {
    return index;
  }

  public isFirstInGroup(index) {
    if (index === 0) {
      return true;
    }
    const curTx = this.history[index];
    const prevTx = this.history[index - 1];
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

  public canSpeedUpTx(tx): boolean {
    if (
      this.wallet.coin !== 'btc' &&
      this.wallet.coin !== 'eth' &&
      !this.currencyProvider.isERCToken(this.wallet.coin)
    )
      return false;

    const isERC20Transfer = tx && tx.abiType && tx.abiType.name === 'transfer';
    const isERC20Wallet = this.currencyProvider.isERCToken(this.wallet.coin);
    const isEthWallet = this.wallet.coin === 'eth';

    if (
      (isEthWallet && !isERC20Transfer) ||
      (isERC20Wallet && isERC20Transfer)
    ) {
      // Can speed up the eth/erc20 tx instantly
      return (
        this.isUnconfirmed(tx) &&
        (tx.action === 'sent' || tx.action === 'moved')
      );
    } else {
      const currentTime = moment();
      const txTime = moment(tx.time * 1000);

      // Can speed up the btc tx after 1 hours without confirming
      return (
        currentTime.diff(txTime, 'hours') >= 1 &&
        this.isUnconfirmed(tx) &&
        tx.action === 'received' &&
        this.wallet.coin == 'btc'
      );
    }
  }

  public openBalanceDetails(): void {
    let walletBalanceModal = this.modalCtrl.create(WalletBalanceModal, {
      status: this.wallet.cachedStatus
    });
    walletBalanceModal.present();
  }

  public back(): void {
    this.navCtrl.pop();
  }

  public openSearchModal(): void {
    const modal = this.modalCtrl.create(
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
      this.goToTxDetails(data);
    });
  }

  public openExternalLink(url: string): void {
    const optIn = true;
    const title = null;
    const message = this.translate.instant(
      'Help and support information is available at the website.'
    );
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

  public doRefresh(refresher) {
    this.updateAll();

    setTimeout(() => {
      refresher.complete();
    }, TIMEOUT_FOR_REFRESHER);
  }

  public close() {
    this.viewCtrl.dismiss();
  }

  public goToReceivePage() {
    if (this.wallet && this.wallet.isComplete() && this.wallet.needsBackup) {
      const needsBackup = this.actionSheetProvider.createNeedsBackup();
      needsBackup.present();
      needsBackup.onDidDismiss(data => {
        if (data === 'goToBackup') this.goToBackup();
      });
    } else {
      const params = {
        wallet: this.wallet
      };
      const receive = this.actionSheetProvider.createWalletReceive(params);
      receive.present();
      receive.onDidDismiss(data => {
        if (data) this.showErrorInfoSheet(data);
      });
    }
  }

  public goToSendPage() {
    this.navCtrl.push(SendPage, {
      wallet: this.wallet
    });
  }

  public goToExchangeCryptoPage() {
    if (this.wallet && this.wallet.isComplete() && this.wallet.needsBackup) {
      const needsBackup = this.actionSheetProvider.createNeedsBackup();
      needsBackup.present();
      needsBackup.onDidDismiss(data => {
        if (data === 'goToBackup') this.goToBackup();
      });
    } else {
      this.analyticsProvider.logEvent('exchange_crypto_button_clicked', {
        from: 'walletDetails',
        coin: this.wallet.coin
      });
      this.navCtrl.push(ExchangeCryptoPage, {
        walletId: this.wallet.id
      });
    }
  }

  public goToBuyCryptoPage() {
    if (this.wallet && this.wallet.isComplete() && this.wallet.needsBackup) {
      const needsBackup = this.actionSheetProvider.createNeedsBackup();
      needsBackup.present();
      needsBackup.onDidDismiss(data => {
        if (data === 'goToBackup') this.goToBackup();
      });
    } else {
      this.analyticsProvider.logEvent('buy_crypto_button_clicked', {
        from: 'walletDetails',
        coin: this.wallet.coin
      });
      this.navCtrl.push(AmountPage, {
        coin: this.wallet.coin,
        fromBuyCrypto: true,
        nextPage: 'CryptoOrderSummaryPage',
        currency: this.configProvider.get().wallet.settings.alternativeIsoCode,
        walletId: this.wallet.id
      });
    }
  }

  public showMoreOptions(): void {
    const showRequest =
      this.wallet && this.wallet.isComplete() && !this.wallet.needsBackup;
    const showShare = showRequest && this.isCordova;
    const optionsSheet = this.actionSheetProvider.createOptionsSheet(
      'wallet-options',
      { showShare, showRequest }
    );
    optionsSheet.present();

    optionsSheet.onDidDismiss(option => {
      if (option == 'request-amount') this.requestSpecificAmount();
      if (option == 'share-address') this.shareAddress();
    });
  }

  private requestSpecificAmount(): void {
    this.walletProvider.getAddress(this.wallet, false).then(addr => {
      this.navCtrl.push(AmountPage, {
        toAddress: addr,
        id: this.wallet.credentials.walletId,
        recipientType: 'wallet',
        name: this.wallet.name,
        color: this.wallet.color,
        coin: this.wallet.coin,
        nextPage: 'CustomAmountPage',
        network: this.wallet.network
      });
    });
  }

  private shareAddress(): void {
    if (!this.isCordova) return;
    this.walletProvider.getAddress(this.wallet, false).then(addr => {
      if (this.platformProvider.isAndroid)
        this.appProvider.skipLockModal = true;
      this.socialSharing.share(addr);
    });
  }

  public showErrorInfoSheet(error: Error | string): void {
    const infoSheetTitle = this.translate.instant('Error');
    this.errorsProvider.showDefaultError(
      this.bwcErrorProvider.msg(error),
      infoSheetTitle
    );
  }

  public goToBackup(): void {
    this.navCtrl.push(BackupKeyPage, {
      keyId: this.wallet.credentials.keyId
    });
  }

  public getBalance() {
    const lastKnownBalance = this.wallet.lastKnownBalance;
    if (this.wallet.coin === 'xrp') {
      const availableBalanceStr =
        this.wallet.cachedStatus &&
        this.wallet.cachedStatus.availableBalanceStr;
      return availableBalanceStr || lastKnownBalance;
    } else {
      const totalBalanceStr =
        this.wallet.cachedStatus && this.wallet.cachedStatus.totalBalanceStr;
      return totalBalanceStr || lastKnownBalance;
    }
  }

  public getAlternativeBalance() {
    if (this.wallet.coin === 'xrp') {
      const availableAlternative =
        this.wallet.cachedStatus &&
        this.wallet.cachedStatus.availableBalanceAlternative;
      return availableAlternative;
    } else {
      const totalBalanceAlternative =
        this.wallet.cachedStatus &&
        this.wallet.cachedStatus.totalBalanceAlternative;
      return totalBalanceAlternative;
    }
  }

  public async viewOnBlockchain() {
    if (
      this.wallet.coin !== 'eth' &&
      this.wallet.coin !== 'xrp' &&
      !this.currencyProvider.isERCToken(this.wallet.coin)
    )
      return;
    const address = await this.walletProvider.getAddress(this.wallet, false);
    let url;
    if (this.wallet.coin === 'xrp') {
      url =
        this.wallet.credentials.network === 'livenet'
          ? `https://${this.blockexplorerUrl}account/${address}`
          : `https://${this.blockexplorerUrlTestnet}account/${address}`;
    }
    if (this.wallet.coin === 'eth') {
      url =
        this.wallet.credentials.network === 'livenet'
          ? `https://${this.blockexplorerUrl}address/${address}`
          : `https://${this.blockexplorerUrlTestnet}address/${address}`;
    }
    if (this.currencyProvider.isERCToken(this.wallet.coin)) {
      url =
        this.wallet.credentials.network === 'livenet'
          ? `https://${this.blockexplorerUrl}address/${address}#tokentxns`
          : `https://${this.blockexplorerUrlTestnet}address/${address}#tokentxns`;
    }
    let optIn = true;
    let title = null;
    let message = this.translate.instant('View History');
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

  getContactName(address: string) {
    const existsContact = _.find(this.addressbook, c => c.address === address);
    if (existsContact) return existsContact.name;
    return null;
  }

  private async checkIfEthMultisigPendingInstantiation() {
    this.logger.debug('Checking for eth multisig pending wallets');
    const pendingInstantiations = await this.persistenceProvider.getEthMultisigPendingInstantiation(
      this.wallet.id
    );
    if (!pendingInstantiations || !pendingInstantiations[0]) return;

    this.logger.debug(
      'Pending eth wallets found: ',
      pendingInstantiations.length
    );
    const promises = [];
    pendingInstantiations.forEach(async info => {
      promises.push(
        this.walletProvider.getMultisigContractInstantiationInfo(this.wallet, {
          sender: info.sender,
          txId: info.txId
        })
      );
    });

    Promise.all(promises).then(multisigContractInstantiationInfo => {
      if (multisigContractInstantiationInfo.length > 0) {
        this.logger.debug(
          'Contract information found: ',
          multisigContractInstantiationInfo.length
        );

        multisigContractInstantiationInfo.forEach((info, index) => {
          if (!info[0]) return;

          this.multisigPendingWallets.push({
            multisigContractAddress: info[0].instantiation,
            txId: info[0].transactionHash
          });
          const pendingInstantiation = pendingInstantiations.filter(info => {
            return info.txId === this.multisigPendingWallets[index].txId;
          });
          this.multisigPendingWallets[index].walletName =
            pendingInstantiation[0].walletName;
          this.multisigPendingWallets[index].n = pendingInstantiation[0].n;
          this.multisigPendingWallets[index].m = pendingInstantiation[0].m;
        });
      }
    });
  }

  public createMultisigWallet(multisigWallet) {
    this.logger.debug(
      'Creating multisig wallet: ',
      multisigWallet.multisigContractAddress
    );

    const multisigEthInfo = {
      multisigContractAddress: multisigWallet.multisigContractAddress,
      walletName: multisigWallet.walletName,
      n: multisigWallet.n,
      m: multisigWallet.m
    };
    this.createAndBindEthMultisigWallet(multisigEthInfo, multisigWallet.txId);
  }

  public createAndBindEthMultisigWallet(multisigEthInfo, txId) {
    this.logger.debug('Multisig Info: ', JSON.stringify(multisigEthInfo));

    this.profileProvider
      .createMultisigEthWallet(this.wallet, multisigEthInfo)
      .then(multisigWallet => {
        // store preferences for the paired eth wallet
        this.walletProvider.updateRemotePreferences(this.wallet);
        this.removeMultisigWallet(txId);
        this.navCtrl.popToRoot().then(_ => {
          this.events.publish('Local/WalletListChange');
          this.navCtrl.push(WalletDetailsPage, {
            walletId: multisigWallet.id
          });
        });
      });
  }

  public async removeMultisigWallet(txId) {
    this.logger.debug('Removing multisig wallet: ', txId);
    let pendingInstantiations = await this.persistenceProvider.getEthMultisigPendingInstantiation(
      this.wallet.id
    );
    pendingInstantiations = pendingInstantiations.filter(info => {
      return info.txId !== txId;
    });
    await this.persistenceProvider.setEthMultisigPendingInstantiation(
      this.wallet.id,
      pendingInstantiations
    );
    this.multisigPendingWallets = this.multisigPendingWallets.filter(
      pendingWallet => {
        return pendingWallet.txId !== txId;
      }
    );
  }

  public viewTxOnBlockchain(txId): void {
    const url =
      this.wallet.credentials.network === 'livenet'
        ? `https://${this.blockexplorerUrl}tx/${txId}`
        : `https://${this.blockexplorerUrlTestnet}tx/${txId}`;

    let optIn = true;
    let title = null;
    let message = this.translate.instant('View Transaction');
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

  public viewAddressOnBlockchain(address): void {
    const url =
      this.wallet.credentials.network === 'livenet'
        ? `https://${this.blockexplorerUrl}address/${address}`
        : `https://${this.blockexplorerUrlTestnet}address/${address}`;

    let optIn = true;
    let title = null;
    let message = this.translate.instant('View Address');
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
