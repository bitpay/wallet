import { HttpClient } from "@angular/common/http";
import { ChangeDetectorRef, Component, NgZone, ViewEncapsulation } from "@angular/core";
import { Router } from "@angular/router";
import { ModalController, ToastController } from "@ionic/angular";
import { TranslateService } from "@ngx-translate/core";
import _ from "lodash";
import moment from "moment";
import { Subscription } from "rxjs";
import { Token } from "src/app/models/tokens/tokens.model";
import { AddressBookProvider } from "src/app/providers";
import { ActionSheetProvider } from "src/app/providers/action-sheet/action-sheet";
import { AddressProvider } from "src/app/providers/address/address";
import { AppProvider } from "src/app/providers/app/app";
import { BwcErrorProvider } from "src/app/providers/bwc-error/bwc-error";
import { ErrorsProvider } from "src/app/providers/errors/errors";
import { EventManagerService } from "src/app/providers/event-manager.service";
import { Logger } from "src/app/providers/logger/logger";
import { ProfileProvider } from "src/app/providers/profile/profile";
import { ThemeProvider } from "src/app/providers/theme/theme";
import { TimeProvider } from "src/app/providers/time/time";
import { TokenProvider } from "src/app/providers/token-sevice/token-sevice";
import { WalletProvider } from "src/app/providers/wallet/wallet";
import { TokenInforPage } from "../token-info/token-info";
import { TxDetailsModal } from "../tx-details/tx-details";
import { SearchTxModalPage } from "../wallet-details/search-tx-modal/search-tx-modal";
const HISTORY_SHOW_LIMIT = 10;
const MIN_UPDATE_TIME = 1000;

interface UpdateWalletOptsI {
  walletId: string;
  force?: boolean;
  wall?: boolean;
}
@Component({
  selector: 'token-details',
  templateUrl: 'token-details.html',
  styleUrls: ['token-details.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TokenDetailsPage {
  private onResumeSubscription: Subscription;
  public navPramss;
  public wallet;
  public token : Token;
  public tokenData;
  public amountToken;
  public selectedTheme;
  public showNoTransactionsYetMsg;
  public updateStatusError;
  public zone;
  public currentTheme;
  private currentPage: number = 0;
  public history = [];
  public groupedHistory = [];
  public updatingTxHistory: boolean;
  public updateTxHistoryError: boolean;
  public updatingTxHistoryProgress: number = 0;
  public addressbook = [];
  public finishParam: any;

  constructor(
    public http: HttpClient,
    private router: Router,
    private profileProvider: ProfileProvider,
    private themeProvider: ThemeProvider,
    private modalCtrl: ModalController,
    private translate: TranslateService,
    private bwcErrorProvider: BwcErrorProvider,
    private errorsProvider: ErrorsProvider,
    private tokenProvider: TokenProvider,
    private logger: Logger,
    private changeDetectorRef: ChangeDetectorRef,
    private events: EventManagerService,
    private timeProvider : TimeProvider,
    private walletProvider: WalletProvider,
    private actionSheetProvider: ActionSheetProvider,
    private appProvider: AppProvider,
    private addressbookProvider: AddressBookProvider,
    public toastController: ToastController
  ) {
    this.currentTheme = this.appProvider.themeProvider.currentAppTheme;
    this.zone = new NgZone({ enableLongStackTrace: false });
    this.selectedTheme = this.themeProvider.currentAppTheme;
    if (this.router.getCurrentNavigation()) {
      this.navPramss = this.router.getCurrentNavigation().extras.state;
    } else {
      this.navPramss = history ? history.state : {};
    }
    this.wallet = this.profileProvider.getWallet(this.navPramss.walletId);
    this.token = this.navPramss.token;

    this.addressbookProvider
      .list(this.wallet.network)
      .then(ab => {
        this.addressbook = ab;
      })
      .catch(err => {
        this.logger.error(err);
      });

  }

  ionViewDidEnter() {
    setTimeout(() => {
      if (this.router.getCurrentNavigation()) {
        this.navPramss = this.router.getCurrentNavigation().extras.state;
      } else {
        this.navPramss = history ? history.state : {};
      }
      if(this.navPramss && this.navPramss.finishParam){
        this.finishParam = this.navPramss.finishParam;
        this.presentToast();
      }
    }, 100);
  }

  async presentToast() {
    const toast = await this.toastController.create({
      message: this.finishParam.finishText,
      duration: 3000,
      position: 'top',
      animated: true,
      cssClass: 'custom-finish-toast',
      buttons:[
        {
          side: 'start',
          icon: 'checkmark-circle',
          handler: () => {
            console.log('');
          }
        }
      ]
    });
    toast.present();
  }

  subscribeEvents() {
    this.events.subscribe('Local/WalletHistoryUpdate', this.updateHistory);
  }

  onViewWillLeave() {
    this.events.unsubscribe('Local/WalletHistoryUpdate', this.updateHistory);
    this.onResumeSubscription.unsubscribe();
  }

  caculateAmountToken(utxoToken, decimals) {
    const totalAmount = _.sumBy(utxoToken, 'amountToken')
    return totalAmount / Math.pow(10, decimals)
  }

  shouldShowZeroState() {
    return this.showNoTransactionsYetMsg && !this.updateStatusError;
  }

  public trackByFn(index) {
    return index;
  }

  loadToken() {
    this.tokenProvider.getUtxosToken(this.wallet).then(utxos => {
      const utxoToken = _.filter(utxos, item => item.tokenId == this.token.tokenId && !item.isNonSLP);
      this.token.utxoToken = utxoToken;
      this.token.amountToken = this.caculateAmountToken(utxoToken, this.token.tokenInfo.decimals);
      this.amountToken = `${this.token.amountToken} ${this.token.tokenInfo.symbol}`
    }).catch(err => {
      this.logger.error(err);
    })
  }

  ionViewWillEnter() {
    this.amountToken = `${this.token.amountToken} ${this.token.tokenInfo.symbol}`;
    this.loadToken();
    // Getting info from cache
    if (this.navPramss.clearCache) {
      this.clearHistoryCache();
    } else {
      this.wallet.completeHistory = _.filter(this.wallet.completeHistory, item => item.tokenId == this.token.tokenId)
      this.fetchTxHistory({
        walletId: this.wallet.credentials.walletId,
        force: true
      });
    }
    this.events.publish('Local/WalletFocus', {
      walletId: this.wallet.credentials.walletId
    });
    this.subscribeEvents();
  }

  public goToSendPage() {
    this.router.navigate(['/send-page'], {
      state: {
        walletId: this.wallet.id,
        token : this.token
      }
    });
  }

  public async openSearchModal(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: SearchTxModalPage,
      componentProps: {
        addressbook: this.addressbook,
        completeHistory: this.wallet.completeHistory,
        wallet: this.wallet
      },
      showBackdrop: false,
      backdropDismiss: true
    })
    await modal.present();
    modal.onDidDismiss().then(({ data }) => {
      if (!data || !data.txid) return;
      this.goToTxDetails(data);
    });
  }

  public goToTokenInfo() {
    this.modalCtrl.create(
      {
        component: TokenInforPage,
        componentProps: {
          walletId: this.wallet.credentials.walletId,
          tokenInfo: this.token.tokenInfo
        }
      }).then(res => {
        res.present();
      })
  }

  public showErrorInfoSheet(error: Error | string): void {
    const infoSheetTitle = this.translate.instant('Error');
    this.errorsProvider.showDefaultError(
      this.bwcErrorProvider.msg(error),
      infoSheetTitle
    );
  }

  public doRefresh(refresher): void {
    this.debounceSetWallets();
    setTimeout(() => {
      refresher.target.complete();
    }, 2000);
  }

  private debounceSetWallets = _.debounce(
    async () => {
      this.loadToken()
      this.events.publish('Local/WalletFocus', {
        walletId: this.wallet.credentials.walletId,
        force: true
      });
      this.changeDetectorRef.detectChanges();
    },
    MIN_UPDATE_TIME,
    {
      leading: true
    }
  );

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

  public goToBackup(): void {
    this.router.navigate(['/backup-key'], {
      state: { keyId: this.wallet.credentials.keyId }
    });
  }

  public loadHistory(loading) {
    if (
      this.history &&
      this.wallet.completeHistory &&
      this.history.length === this.wallet.completeHistory.length
    ) {
      loading.target.complete();
      return;
    }
    setTimeout(() => {
      this.showHistory(true); // loading in true
      loading.target.complete();
    }, 300);
  }

  updateAddressToShowToken(tx) {
    const outputAddr = tx.outputs[0].address;
    let addressToShow = this.walletProvider.getAddressView(
      this.wallet.coin,
      this.wallet.network,
      outputAddr,
      true
    );
    return addressToShow;
  }

  private updateHistoryToken(tx) {
    const tokenInfo = this.token.tokenInfo
    if (tx.action == 'sent') {
      tx.addressTo = this.updateAddressToShowToken(tx)
    }
    tx.amountToken = tx.amountTokenUnit / Math.pow(10, tokenInfo.decimals);
    tx.symbolToken = tokenInfo.symbol;
    tx.name = tokenInfo.name;
    tx.isGenesis = tx.txType == 'GENESIS'
    if (tx.txType == 'GENESIS') tx.action = 'received';
  }

  private groupHistory(history) {
    return history.reduce((groups, tx, txInd) => {
      this.updateHistoryToken(tx);
      this.isFirstInGroup(txInd)
        ? groups.push([tx])
        : groups[groups.length - 1].push(tx);
      return groups;
    }, []);
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

  private clearHistoryCache() {
    this.history = [];
    this.currentPage = 0;
  }

  private fetchTxHistory(opts: UpdateWalletOptsI) {
    if (!opts.walletId) {
      this.logger.error('Error no walletId in update History');
      return;
    }

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
      .fetchTxHistory(this.wallet, progressFn, opts)
      .then(txHistory => {
        this.wallet.completeHistory =  _.filter(txHistory, item => item.tokenId == this.token.tokenId) ;
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
  

  private showHistory(loading?: boolean) {
    if (!this.wallet.completeHistory) return;
    this.history = _.filter(this.wallet.completeHistory, item => item.tokenId == this.token.tokenId)
    this.history = this.history.slice(
      0,
      (this.currentPage + 1) * HISTORY_SHOW_LIMIT
    );
    this.zone.run(() => {
      this.groupedHistory = this.groupHistory(this.history);
    });
    if (loading) this.currentPage++;
  }

  private updateHistory = opts => {
    this.logger.debug('RECV Local/WalletHistoryUpdate @tokenDetails', opts);
    if (opts.walletId != this.wallet.id) return;

    if (opts.finished) {
      this.updatingTxHistoryProgress = 0;
      this.updatingTxHistory = false;
      this.updateTxHistoryError = false;

      const hasTx = !!this.wallet.completeHistory[0];

      this.showNoTransactionsYetMsg = !hasTx;

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
      }
    }
  }

  public canSpeedUpTx(tx): boolean {
    if (this.wallet.coin !== 'btc' && this.wallet.coin !== 'eth') return false;

    const currentTime = moment();
    const txTime = moment(tx.time * 1000);

    // Can speed up the tx after 4 hours without confirming
    return (
      currentTime.diff(txTime, 'hours') >= 4 &&
      this.isUnconfirmed(tx) &&
      ((tx.action === 'received' && this.wallet.coin == 'btc') ||
        ((tx.action === 'sent' || tx.action === 'moved') &&
          this.wallet.coin === 'eth'))
    );
  }

  public isUnconfirmed(tx) {
    return !tx.confirmations || tx.confirmations === 0;
  }

  public isDateInCurrentMonth(date) {
    return this.timeProvider.isDateInCurrentMonth(date);
  }

  public getDate(txCreated) {
    const date = new Date(txCreated * 1000);
    return date;
  }

  converDate(number) {
    return new Date(number);
  }

  shouldShowSpinner() {
    return (
      (this.updatingTxHistory) &&
      !this.updateStatusError &&
      !this.updateTxHistoryError
    );
  }

  public createdWithinPastDay(time) {
    return this.timeProvider.withinPastDay(time);
  }

  public itemTapped(tx) {
    if (tx.hasUnconfirmedInputs) {
      const infoSheet = this.actionSheetProvider.createInfoSheet(
        'unconfirmed-inputs'
      );
      infoSheet.present();
      infoSheet.onDidDismiss(() => {
        this.goToTxDetails(tx);
      });
    } else {
      this.goToTxDetails(tx);
    }
  }
  
  public goToTxDetails(tx) {
    this.modalCtrl.create(
      {
        component: TxDetailsModal,
        componentProps: {
          walletId: this.wallet.credentials.walletId,
          txid: tx.txid,
          tokenData: {
            amountToken : tx.amountToken,
            tokenId: tx.tokenId,
            symbolToken: tx.symbolToken,
            name: tx.name
          }
        }
      }).then(res => {
        res.present();
      })
  }

  openWalletSettings(id) {

  }

  updateAll(id) {

  }

  toggleBalance() {

  }
  
}