import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ModalController, NavController, NavParams } from 'ionic-angular';
// import * as _ from 'lodash';
import * as moment from 'moment';

// Pages
import { FinishModalPage } from '../../finish/finish';
import { ChangellyPage } from '../../integrations/changelly/changelly';

// Providers
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { BwcErrorProvider } from '../../../providers/bwc-error/bwc-error';
import { ChangellyProvider } from '../../../providers/changelly/changelly';
import { ConfigProvider } from '../../../providers/config/config';
import { CurrencyProvider } from '../../../providers/currency/currency';
// import { ErrorsProvider } from '../../../providers/errors/errors';
import { Logger } from '../../../providers/logger/logger';
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
// import { PopupProvider } from '../../../providers/popup/popup';
import { ProfileProvider } from '../../../providers/profile/profile';
import { RateProvider } from '../../../providers/rate/rate';
import {
  TransactionProposal,
  WalletProvider
} from '../../../providers/wallet/wallet';

@Component({
  selector: 'page-exchange-checkout',
  templateUrl: 'exchange-checkout.html'
})
export class ExchangeCheckoutPage {
  public fromWalletSelected;
  public toWalletSelected;

  public amountFrom: number;
  public amountTo: number;
  public alternativeIsoCode: string;
  public fixedRateId: string;
  public rate: number;
  public termsAccepted: boolean;
  public fee;
  public fiatAmountTo;
  private ctxp;

  private exchangeFee: number;
  private bitpayFee: number;
  private status: string;
  public totalExchangeFee: number;
  public exchangeTxId: string;
  public payinAddress: string;
  public payinExtraId: string;

  public paymentExpired: boolean;
  public remainingTimeStr: string;

  private message: string;
  private addressFrom: string;
  private addressTo: string;

  constructor(
    private actionSheetProvider: ActionSheetProvider,
    private logger: Logger,
    private navParams: NavParams,
    private modalCtrl: ModalController,
    private changellyProvider: ChangellyProvider,
    private navCtrl: NavController,
    private profileProvider: ProfileProvider,
    private translate: TranslateService,
    // private errorsProvider: ErrorsProvider,
    // private popupProvider: PopupProvider,
    private configProvider: ConfigProvider,
    private currencyProvider: CurrencyProvider,
    private rateProvider: RateProvider,
    private walletProvider: WalletProvider,
    private bwcErrorProvider: BwcErrorProvider,
    private onGoingProcessProvider: OnGoingProcessProvider
  ) {
    this.fromWalletSelected = this.profileProvider.getWallet(
      this.navParams.data.fromWalletSelectedId
    );
    this.toWalletSelected = this.profileProvider.getWallet(
      this.navParams.data.toWalletSelectedId
    );
    this.amountFrom = this.navParams.data.amountFrom;
    this.fixedRateId = this.navParams.data.fixedRateId;
    this.rate = this.navParams.data.rate;
    this.alternativeIsoCode =
      this.configProvider.get().wallet.settings.alternativeIsoCode || 'USD';
    this.termsAccepted = false;
    this.createFixTransaction();
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: ExchangeCheckoutPage');
  }

  ionViewWillEnter() {}

  private createFixTransaction() {
    this.walletProvider
      .getAddress(this.toWalletSelected, false)
      .then((addressTo: string) => {
        this.addressTo = addressTo;

        this.walletProvider
          .getAddress(this.fromWalletSelected, false)
          .then((refundAddress: string) => {
            this.addressFrom = refundAddress;

            const data = {
              amountFrom: this.amountFrom,
              coinFrom: this.fromWalletSelected.coin,
              coinTo: this.toWalletSelected.coin,
              addressTo: this.addressTo,
              refundAddress: this.addressFrom,
              fixedRateId: this.fixedRateId
            };

            this.changellyProvider
              .createFixTransaction(data)
              .then(data => {
                if (data.error) {
                  this.logger.error('Changelly error: ' + data.error.message);
                  if (
                    Math.abs(data.error.code) == 32602 ||
                    Math.abs(data.error.code) == 32603
                  ) {
                    this.updateReceivingAmount();
                  } else {
                    this.showErrorAndBack(null, data.error.message);
                  }
                  return;
                }

                if (
                  Number(data.result.changellyFee) > 0 ||
                  Number(data.result.apiExtraFee > 0)
                ) {
                  // changellyFee and apiExtraFee (bitpay fee) are in percents
                  const receivingPercentage =
                    100 -
                    Number(data.result.changellyFee) -
                    Number(data.result.apiExtraFee);
                  this.exchangeFee =
                    (Number(data.result.changellyFee) * data.result.amountTo) /
                    receivingPercentage;
                  this.bitpayFee =
                    (Number(data.result.apiExtraFee) * data.result.amountTo) /
                    receivingPercentage;
                  this.totalExchangeFee = this.exchangeFee + this.bitpayFee;
                  this.logger.debug(
                    `Changelly fee: ${this.exchangeFee} - BitPay fee: ${this.bitpayFee} - Total fee: ${this.totalExchangeFee}`
                  );
                }

                this.payinAddress = data.result.payinAddress;
                this.payinExtraId = data.result.payinExtraId; // Used for coins like: XRP, XLM, EOS, IGNIS, BNB, XMR, ARDOR, DCT, XEM
                this.exchangeTxId = data.result.id;
                this.amountFrom = data.result.amountExpectedFrom;
                this.amountTo = data.result.amountTo;
                this.status = data.result.status;

                this.fiatAmountTo = this.rateProvider.toFiat(
                  Number(this.amountTo) *
                    this.currencyProvider.getPrecision(
                      this.toWalletSelected.coin
                    ).unitToSatoshi,
                  this.alternativeIsoCode,
                  this.toWalletSelected.coin
                );

                console.log('-------- this.fiatAmountTo: ', this.fiatAmountTo);

                console.log(new Date(data.result.createdAt));
                console.log(new Date(data.result.payTill));
                this.paymentTimeControl(data.result.payTill);

                console.log('========== createFixTransaction data: ', data);

                // To Sat
                const depositSat = Number(
                  (
                    this.amountFrom *
                    this.currencyProvider.getPrecision(
                      this.fromWalletSelected.coin
                    ).unitToSatoshi
                  ).toFixed(0)
                );

                this.onGoingProcessProvider.set('creatingTx');
                this.createTx(
                  this.fromWalletSelected,
                  this.payinAddress,
                  depositSat
                )
                  .then(ctxp => {
                    this.onGoingProcessProvider.clear();
                    console.log('========== ctxp', ctxp);
                    this.ctxp = ctxp;
                    this.fee = this.ctxp.fee;
                    return;
                  })
                  .catch(err => {
                    this.onGoingProcessProvider.clear();
                    console.log(err);
                    this.showErrorAndBack(err.title, err.message);
                    return;
                  });
              })
              .catch(err => {
                let msg = this.translate.instant(
                  'Changelly is not available at this moment. Please, try again later.'
                );
                console.log('========== createFixTransaction err: ', msg, err);
              });
          })
          .catch(err => {
            console.log('Could not get returnAddress address', err);
            return;
          });
      })
      .catch(err => {
        console.log('Could not get withdrawalAddress address', err);
        return;
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
          this.showErrorAndBack(null, data.error.message);
          return;
        }
        let pair =
          this.fromWalletSelected.coin + '_' + this.toWalletSelected.coin;
        console.log('========== updateReceivingAmount data: ', pair, data);
        this.fixedRateId = data.result[0].id;
        this.amountTo = Number(data.result[0].amountTo);
        this.rate = Number(data.result[0].result); // result == rate

        this.createFixTransaction();
      })
      .catch(err => {
        let msg = this.translate.instant(
          'Changelly is not available at this moment. Please, try again later.'
        );
        console.log('========== updateReceivingAmount err: ', msg, err);
      });
  }

  private paymentTimeControl(expires: string): void {
    const expirationTime = Math.floor(new Date(expires).getTime() / 1000);
    this.paymentExpired = false;
    this.setExpirationTime(expirationTime);

    const countDown = setInterval(() => {
      this.setExpirationTime(expirationTime, countDown);
    }, 1000);
  }

  private setExpirationTime(expirationTime: number, countDown?): void {
    const now = Math.floor(Date.now() / 1000);

    if (now > expirationTime) {
      this.paymentExpired = true;
      this.remainingTimeStr = this.translate.instant('Expired');
      if (countDown) {
        /* later */
        clearInterval(countDown);
      }
      return;
    }

    const totalSecs = expirationTime - now;
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    this.remainingTimeStr = ('0' + m).slice(-2) + ':' + ('0' + s).slice(-2);
  }

  private createTx(
    wallet,
    payinAddress: string,
    depositSat: number,
    destTag?: string
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      this.message =
        this.fromWalletSelected.coin.toUpperCase() +
        ' to ' +
        this.toWalletSelected.coin.toUpperCase();
      let outputs = [];

      outputs.push({
        toAddress: payinAddress,
        amount: depositSat,
        message: this.message
      });

      let txp: Partial<TransactionProposal> = {
        toAddress: payinAddress,
        amount: depositSat,
        outputs,
        message: this.message,
        excludeUnconfirmedUtxos: true, // Do not use unconfirmed UTXOs
        customData: {
          changelly: payinAddress,
          service: 'changelly'
        }
      };

      // if (this.sendMaxInfo) {
      //   txp.inputs = this.sendMaxInfo.inputs;
      //   txp.fee = this.sendMaxInfo.fee;
      // } else {
      if (wallet.coin != 'bch' && wallet.coin != 'xrp')
        txp.feeLevel = 'priority'; // Avoid expired order due to slow TX confirmation
      // }

      if (destTag) txp.destinationTag = destTag;

      console.log('============== txp: ', txp);

      this.walletProvider
        .createTx(wallet, txp)
        .then(ctxp => {
          return resolve(ctxp);
        })
        .catch(err => {
          return reject({
            title: this.translate.instant('Could not create transaction'),
            message: this.bwcErrorProvider.msg(err)
          });
        });
    });
  }

  public makePayment() {
    this.onGoingProcessProvider.set('broadcastingTx');

    this.publishAndSign(this.fromWalletSelected, this.ctxp)
      .then(txSent => {
        console.log('========== txSent', txSent);
        this.onGoingProcessProvider.clear();
        this.saveChangellyData();
      })
      .catch(err => {
        this.onGoingProcessProvider.clear();
        this.logger.error(this.bwcErrorProvider.msg(err));
        this.showErrorAndBack(
          null,
          this.translate.instant('Could not send transaction')
        );
        return;
      });
  }

  private publishAndSign(wallet, txp): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!wallet.canSign) {
        let err = this.translate.instant('No signing proposal: No private key');
        return reject(err);
      }

      this.walletProvider
        .publishAndSign(wallet, txp)
        .then(txp => {
          this.onGoingProcessProvider.clear();
          return resolve(txp);
        })
        .catch(err => {
          this.onGoingProcessProvider.clear();

          return reject(err);
        });
    });
  }

  private saveChangellyData(): void {
    const now = moment().unix() * 1000;

    let newData = {
      exchangeTxId: this.exchangeTxId,
      date: now,
      rate: this.rate, // rate = amountTo/amountFrom
      amountTo: this.amountTo,
      cointTo: this.toWalletSelected.coin,
      addressTo: this.addressTo,
      amountFrom: this.amountFrom,
      coinFrom: this.fromWalletSelected.coin,
      refundAddress: this.addressFrom || null,
      payinAddress: this.payinAddress,
      payinExtraId: this.payinExtraId || null,
      totalExchangeFee: this.totalExchangeFee,
      status: this.status,
      error: null
    };

    this.changellyProvider.saveChangelly(newData, null).then(() => {
      this.logger.debug(
        'Saved exchange with status: ' + (newData.status || newData.error)
      );
      this.openFinishModal();
    });
  }

  private openFinishModal(): void {
    let finishText = 'Transaction Sent';
    let modal = this.modalCtrl.create(
      FinishModalPage,
      { finishText },
      { showBackdrop: true, enableBackdropDismiss: false }
    );
    modal.present();
    modal.onDidDismiss(async () => {
      await this.navCtrl.popToRoot({ animate: false });
      await this.navCtrl.push(ChangellyPage, null, { animate: false });
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

  public canContinue(): boolean {
    return this.termsAccepted && this.exchangeTxId && !this.paymentExpired;
  }

  public cancelExchange() {
    this.navCtrl.popToRoot();
  }
}
