import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ModalController, NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';

// Pages
import { ExchangeCheckoutPage } from '../../pages/exchange-crypto/exchange-checkout/exchange-checkout';
import { ChangellyPage } from '../../pages/integrations/changelly/changelly';
import { AmountPage } from '../../pages/send/amount/amount';

// Providers
import { ActionSheetProvider } from '../../providers/action-sheet/action-sheet';
import { ChangellyProvider } from '../../providers/changelly/changelly';
import { CurrencyProvider } from '../../providers/currency/currency';
import { ExchangeCryptoProvider } from '../../providers/exchange-crypto/exchange-crypto';
import { Logger } from '../../providers/logger/logger';
import { OnGoingProcessProvider } from '../../providers/on-going-process/on-going-process';
import { ProfileProvider } from '../../providers/profile/profile';
import { ThemeProvider } from '../../providers/theme/theme';
import { TxFormatProvider } from '../../providers/tx-format/tx-format';

@Component({
  selector: 'page-exchange-crypto',
  templateUrl: 'exchange-crypto.html'
})
export class ExchangeCryptoPage {
  public isOpenSelectorFrom: boolean;
  public isOpenSelectorTo: boolean;
  public allWallets;
  public toWallets;
  public fromWallets;
  public loading: boolean;
  public changellySwapTxs: any[];
  public useSendMax: boolean;

  public fromWalletSelectorTitle: string;
  public toWalletSelectorTitle: string;
  public fromWalletSelected;
  public toWalletSelected;

  public amountFrom: number;
  public amountTo: number;
  public minAmount: number;
  public maxAmount: number;
  public fixedRateId: string;
  public rate: number;

  private supportedCoins: string[];

  constructor(
    private actionSheetProvider: ActionSheetProvider,
    private logger: Logger,
    private modalCtrl: ModalController,
    private changellyProvider: ChangellyProvider,
    private navCtrl: NavController,
    private navParams: NavParams,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private profileProvider: ProfileProvider,
    private translate: TranslateService,
    private currencyProvider: CurrencyProvider,
    private txFormatProvider: TxFormatProvider,
    private exchangeCryptoProvider: ExchangeCryptoProvider,
    public themeProvider: ThemeProvider
  ) {
    this.allWallets = [];
    this.toWallets = [];
    this.fromWallets = [];
    this.loading = false;
    this.fromWalletSelectorTitle = this.translate.instant(
      'Select Source Wallet'
    );
    this.toWalletSelectorTitle = this.translate.instant(
      'Select Destination Wallet'
    );
    this.onGoingProcessProvider.set('connectingChangelly');

    this.exchangeCryptoProvider.getSwapTxs().then(res => {
      this.changellySwapTxs = res.changellySwapTxs;
    });

    this.changellyProvider
      .getCurrencies()
      .then(data => {
        if (data.error) {
          this.logger.error(
            'Changelly getCurrencies Error: ' + data.error.message
          );
          this.showErrorAndBack(
            null,
            this.translate.instant(
              'Changelly is not available at this moment. Please, try again later.'
            )
          );
          return;
        }

        if (
          data &&
          data.result &&
          _.isArray(data.result) &&
          data.result.length > 0
        ) {
          this.supportedCoins = _.intersection(
            this.currencyProvider.getAvailableCoins(),
            data.result
          );
          const index = this.supportedCoins.indexOf('xrp');
          if (index > -1) {
            this.logger.debug('Removing XRP from supported coins');
            this.supportedCoins.splice(index, 1);
          }
        }

        this.logger.debug('Changelly supportedCoins: ' + this.supportedCoins);

        this.allWallets = this.profileProvider.getWallets({
          network: 'livenet',
          onlyComplete: true,
          coin: this.supportedCoins,
          backedUp: true
        });

        this.onGoingProcessProvider.clear();

        if (_.isEmpty(this.allWallets)) {
          this.showErrorAndBack(
            null,
            this.translate.instant('No wallets available to use this exchange')
          );
          return;
        }

        this.fromWallets = this.allWallets.filter(w => {
          return w.cachedStatus && w.cachedStatus.availableBalanceSat > 0;
        });

        if (_.isEmpty(this.fromWallets)) {
          this.showErrorAndBack(
            null,
            this.translate.instant('No wallets with funds')
          );
          return;
        }

        if (this.navParams.data.walletId) {
          const wallet = this.profileProvider.getWallet(
            this.navParams.data.walletId
          );
          if (!wallet.coin || !this.supportedCoins.includes(wallet.coin)) {
            this.showErrorAndBack(
              null,
              this.translate.instant(
                'Currently our partner does not support exchanges with the selected coin'
              )
            );
            return;
          } else {
            if (
              wallet.cachedStatus &&
              wallet.cachedStatus.spendableAmount &&
              wallet.cachedStatus.spendableAmount > 0
            ) {
              this.onWalletSelect(wallet, 'from');
            } else {
              this.onWalletSelect(wallet, 'to');
            }
          }
        }
      })
      .catch(err => {
        this.logger.error('Changelly getCurrencies Error: ', err);
        this.showErrorAndBack(
          null,
          this.translate.instant(
            'Changelly is not available at this moment. Please, try again later.'
          )
        );
      });
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: ExchangeCryptoPage');
  }

  public showWallets(selector: string): void {
    let walletsForActionSheet = [];
    let selectedWalletId: string;
    let title: string =
      selector == 'from'
        ? this.fromWalletSelectorTitle
        : this.toWalletSelectorTitle;
    if (selector == 'from') {
      this.isOpenSelectorFrom = true;
      walletsForActionSheet = this.fromWallets;
      selectedWalletId = this.fromWalletSelected
        ? this.fromWalletSelected.id
        : null;
    } else if (selector == 'to') {
      this.isOpenSelectorTo = true;
      walletsForActionSheet = this.toWallets;
      selectedWalletId = this.toWalletSelected
        ? this.toWalletSelected.id
        : null;
    }
    const params = {
      wallets: walletsForActionSheet,
      selectedWalletId,
      title
    };
    const walletSelector = this.actionSheetProvider.createWalletSelector(
      params
    );
    walletSelector.present();
    walletSelector.onDidDismiss(wallet => {
      this.isOpenSelectorFrom = false;
      this.isOpenSelectorTo = false;

      if (!_.isEmpty(wallet)) this.onWalletSelect(wallet, selector);
    });
  }

  private showToWallets(): void {
    this.toWallets = this.allWallets.filter(
      w =>
        !w.needsBackup &&
        w.id != this.fromWalletSelected.id &&
        w.coin != this.fromWalletSelected.coin
    );

    if (_.isEmpty(this.toWallets)) {
      let msg = this.translate.instant(
        'Destination wallet needs to be backed up'
      );
      this.showErrorAndBack(null, msg);
      return;
    }
  }

  public onWalletSelect(wallet, selector: string): void {
    if (selector == 'from') {
      this.onFromWalletSelect(wallet);
    } else if (selector == 'to') {
      this.onToWalletSelect(wallet);
    }
  }

  public onFromWalletSelect(wallet): void {
    this.fromWalletSelected = wallet;
    this.toWalletSelected = null; // Clear variable to select wallet again
    this.amountFrom = null; // Clear amount and rate to avoid mistakes
    this.rate = null;
    this.fixedRateId = null;
    this.showToWallets();
  }

  public onToWalletSelect(wallet): void {
    this.toWalletSelected = wallet;
    this.updateMaxAndMin();
  }

  private updateMaxAndMin() {
    this.amountTo = null;
    this.rate = null;
    if (!this.fromWalletSelected || !this.toWalletSelected || !this.amountFrom)
      return;

    this.loading = true;
    let pair = this.fromWalletSelected.coin + '_' + this.toWalletSelected.coin;
    this.logger.debug('Updating max and min with pair: ' + pair);

    const data = {
      coinFrom: this.fromWalletSelected.coin,
      coinTo: this.toWalletSelected.coin
    };
    this.changellyProvider
      .getPairsParams(this.fromWalletSelected, data)
      .then(data => {
        if (data.error) {
          const msg = 'Changelly getPairsParams Error: ' + data.error.message;
          this.showErrorAndBack(null, msg, true);
          return;
        }

        this.minAmount = Number(data.result[0].minAmountFixed);
        this.maxAmount = Number(data.result[0].maxAmountFixed);
        this.logger.debug(
          `Min amount: ${this.minAmount} - Max amount: ${this.maxAmount}`
        );
        if (this.amountFrom > this.maxAmount) {
          const errorActionSheet = this.actionSheetProvider.createInfoSheet(
            'max-amount-allowed',
            {
              maxAmount: this.maxAmount,
              coin: this.fromWalletSelected.coin.toUpperCase()
            }
          );
          errorActionSheet.present();
          errorActionSheet.onDidDismiss(option => {
            if (option) {
              this.amountFrom = this.maxAmount;
              this.updateReceivingAmount();
            }
          });
          return;
        }
        if (this.amountFrom < this.minAmount) {
          const errorActionSheet = this.actionSheetProvider.createInfoSheet(
            'min-amount-allowed',
            {
              minAmount: this.minAmount,
              coin: this.fromWalletSelected.coin.toUpperCase()
            }
          );
          errorActionSheet.present();
          errorActionSheet.onDidDismiss(option => {
            if (option) {
              this.amountFrom = this.minAmount;
              this.updateReceivingAmount();
            }
          });
          return;
        }
        this.updateReceivingAmount();
      })
      .catch(err => {
        this.logger.error('Changelly getPairsParams Error: ', err);
        this.showErrorAndBack(
          null,
          this.translate.instant(
            'Changelly is not available at this moment. Please, try again later.'
          )
        );
      });
  }

  private showErrorAndBack(title: string, msg, noExit?: boolean): void {
    this.onGoingProcessProvider.clear();
    this.loading = false;
    title = title ? title : this.translate.instant('Error');
    this.logger.error(msg);
    msg = msg && msg.error && msg.error.message ? msg.error.message : msg;
    const errorActionSheet = this.actionSheetProvider.createInfoSheet(
      'default-error',
      {
        msg,
        title
      }
    );
    errorActionSheet.present();
    errorActionSheet.onDidDismiss(_option => {
      if (!noExit) this.navCtrl.pop();
    });
  }

  public openAmountModal() {
    let modal = this.modalCtrl.create(
      AmountPage,
      {
        fixedUnit: false,
        fromExchangeCrypto: true,
        walletId: this.fromWalletSelected.id,
        coin: this.fromWalletSelected.coin,
        useAsModal: true
      },
      {
        showBackdrop: true,
        enableBackdropDismiss: true
      }
    );
    modal.present();
    modal.onDidDismiss(data => {
      if (data) {
        this.amountFrom = this.txFormatProvider.satToUnit(
          data.amount,
          data.coin
        );
        this.useSendMax = data.useSendMax;
        this.updateMaxAndMin();
      }
    });
  }

  private updateReceivingAmount() {
    if (
      !this.fromWalletSelected ||
      !this.toWalletSelected ||
      !this.amountFrom
    ) {
      this.loading = false;
      return;
    }

    if (
      this.fromWalletSelected.cachedStatus &&
      this.fromWalletSelected.cachedStatus.spendableAmount
    ) {
      const spendableAmount = this.txFormatProvider.satToUnit(
        this.fromWalletSelected.cachedStatus.spendableAmount,
        this.fromWalletSelected.coin
      );

      if (spendableAmount < this.amountFrom) {
        this.loading = false;
        this.showErrorAndBack(
          null,
          this.translate.instant(
            'You are trying to send more funds than you have available. Make sure you do not have funds locked by pending transaction proposals or enter a valid amount.'
          ),
          true
        );
        return;
      }
    }

    const pair =
      this.fromWalletSelected.coin + '_' + this.toWalletSelected.coin;
    this.logger.debug('Updating receiving amount with pair: ' + pair);

    const data = {
      amountFrom: this.amountFrom,
      coinFrom: this.fromWalletSelected.coin,
      coinTo: this.toWalletSelected.coin
    };
    this.changellyProvider
      .getFixRateForAmount(this.fromWalletSelected, data)
      .then(data => {
        if (data.error) {
          const msg =
            'Changelly getFixRateForAmount Error: ' + data.error.message;
          this.showErrorAndBack(null, msg, true);
          return;
        }

        this.fixedRateId = data.result[0].id;
        this.amountTo = Number(data.result[0].amountTo);
        this.rate = Number(data.result[0].result); // result == rate
        this.loading = false;
      })
      .catch(err => {
        this.logger.error('Changelly getFixRateForAmount Error: ', err);
        this.showErrorAndBack(
          null,
          this.translate.instant(
            'Changelly is not available at this moment. Please, try again later.'
          )
        );
      });
  }

  public canContinue(): boolean {
    return (
      this.toWalletSelected &&
      this.fromWalletSelected &&
      this.amountTo &&
      this.minAmount &&
      this.maxAmount &&
      this.amountFrom >= this.minAmount &&
      this.amountFrom <= this.maxAmount
    );
  }

  public goToExchangeCheckoutPage() {
    const data = {
      fromWalletSelectedId: this.fromWalletSelected.id,
      toWalletSelectedId: this.toWalletSelected.id,
      fixedRateId: this.fixedRateId,
      amountFrom: this.amountFrom,
      coinFrom: this.fromWalletSelected.coin,
      coinTo: this.toWalletSelected.coin,
      rate: this.rate,
      useSendMax: this.useSendMax
    };

    this.navCtrl.push(ExchangeCheckoutPage, data);
  }

  public goToExchangeHistory() {
    this.navCtrl.push(ChangellyPage);
  }
}
