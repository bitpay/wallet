import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ModalController, NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';

// Pages
import { ExchangeCheckoutPage } from '../../pages/exchange-crypto/exchange-checkout/exchange-checkout';
import { AmountPage } from '../../pages/send/amount/amount';

// Providers
import { ActionSheetProvider } from '../../providers/action-sheet/action-sheet';
import { ChangellyProvider } from '../../providers/changelly/changelly';
import { CurrencyProvider } from '../../providers/currency/currency';
// import { ErrorsProvider } from '../../providers/errors/errors';
import { Logger } from '../../providers/logger/logger';
import { OnGoingProcessProvider } from '../../providers/on-going-process/on-going-process';
import { ProfileProvider } from '../../providers/profile/profile';
import { ReplaceParametersProvider } from '../../providers/replace-parameters/replace-parameters';
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
    private navParams: NavParams,
    private modalCtrl: ModalController,
    private changellyProvider: ChangellyProvider,
    private navCtrl: NavController,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private profileProvider: ProfileProvider,
    private translate: TranslateService,
    // private errorsProvider: ErrorsProvider,
    private currencyProvider: CurrencyProvider,
    private replaceParametersProvider: ReplaceParametersProvider,
    private txFormatProvider: TxFormatProvider
  ) {
    console.log('exchangeCryptoPage navParams: ', this.navParams);
    // this.loading = true;
    this.allWallets = [];
    this.toWallets = [];
    this.fromWallets = [];
    this.fromWalletSelectorTitle = this.translate.instant(
      'Select Source Wallet'
    );
    this.toWalletSelectorTitle = this.translate.instant(
      'Select Destination Wallet'
    );
    this.onGoingProcessProvider.set('connectingChangelly');

    this.changellyProvider
      .getCurrencies()
      .then(data => {
        console.log('===== getCurrencies data: ', data);
        console.log(
          '==== this.currencyProvider.getAvailableCoins(): ',
          this.currencyProvider.getAvailableCoins()
        );

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
        }

        console.log('====== this.supportedCoins: ', this.supportedCoins);

        this.allWallets = this.profileProvider.getWallets({
          network: 'livenet',
          onlyComplete: true,
          coin: this.supportedCoins,
          backedUp: true
        });

        // this.loading = false;
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
      })
      .catch(err => {
        console.log('========== getCurrencies err: ', err);
        this.showErrorAndBack(
          null,
          this.translate.instant(
            'Changelly is not available now. Please try later.'
          )
        );
      });
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: ExchangeCryptoPage');
  }

  public cancelExchange() {
    this.navCtrl.popToRoot();
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
    console.log('selected wallet: ', wallet, selector);

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
    if (!this.fromWalletSelected || !this.toWalletSelected || !this.amountFrom)
      return;
    let msg = this.translate.instant(
      'Changelly is not available at this moment. Please, try again later.'
    );
    let pair = this.fromWalletSelected.coin + '_' + this.toWalletSelected.coin;

    const data = {
      coinFrom: this.fromWalletSelected.coin,
      coinTo: this.toWalletSelected.coin
    };
    this.changellyProvider
      .getPairsParams(data)
      .then(data => {
        console.log('========== updateMaxAndMin data: ', pair, data);
        this.minAmount = Number(data.result[0].minAmountFixed);
        this.maxAmount = Number(data.result[0].maxAmountFixed);
        this.logger.debug(
          `Min amount: ${this.minAmount} - Max amount: ${this.maxAmount}`
        );
        if (this.amountFrom > this.maxAmount) {
          const msg = this.replaceParametersProvider.replace(
            this.translate.instant(
              'The amount entered is greater than the maximum allowed ({{maxAmount}} {{coin}})'
            ),
            { maxAmount: this.maxAmount, coin: this.fromWalletSelected.coin }
          );
          this.showErrorAndBack(null, msg, true);
          return;
        }
        if (this.amountFrom < this.minAmount) {
          const msg = this.replaceParametersProvider.replace(
            this.translate.instant(
              'The amount entered is lower than the minimum allowed ({{minAmount}} {{coin}})'
            ),
            { minAmount: this.minAmount, coin: this.fromWalletSelected.coin }
          );
          this.showErrorAndBack(null, msg, true);
          return;
        }
        this.updateReceivingAmount();
      })
      .catch(err => {
        console.log('========== updateMaxAndMin err: ', msg, err);
      });
  }

  private showErrorAndBack(title: string, msg, noExit?: boolean): void {
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
        fixedUnit: true,
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
        console.log('from Amount modal data: ', data, this.amountFrom);
        this.updateMaxAndMin();
      }
    });
  }

  private updateReceivingAmount() {
    if (!this.fromWalletSelected || !this.toWalletSelected || !this.amountFrom)
      return;
    const data = {
      amountFrom: this.amountFrom,
      coinFrom: this.fromWalletSelected.coin,
      coinTo: this.toWalletSelected.coin
    };
    this.changellyProvider
      .getFixRateForAmount(data)
      .then(data => {
        if (data.error) {
          this.logger.error('Changelly error: ' + data.error.message);
          return;
        }
        let pair =
          this.fromWalletSelected.coin + '_' + this.toWalletSelected.coin;
        console.log('========== updateReceivingAmount data: ', pair, data);
        this.fixedRateId = data.result[0].id;
        this.amountTo = Number(data.result[0].amountTo);
        this.rate = Number(data.result[0].result); // result == rate
      })
      .catch(err => {
        let msg = this.translate.instant(
          'Changelly is not available at this moment. Please, try again later.'
        );
        console.log('========== updateReceivingAmount err: ', msg, err);
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
      rate: this.rate
    };

    this.navCtrl.push(ExchangeCheckoutPage, data);
  }
}
