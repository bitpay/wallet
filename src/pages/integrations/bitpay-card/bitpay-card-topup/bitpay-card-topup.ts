import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events, ModalController, NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';
import { Logger } from '../../../../providers/logger/logger';

// Pages
import { FinishModalPage } from '../../../finish/finish';
import { FeeWarningPage } from '../../../send/fee-warning/fee-warning';
import { BitPayCardPage } from '../bitpay-card';

// Provider
import { BitPayCardProvider } from '../../../../providers/bitpay-card/bitpay-card';
import { BitPayProvider } from '../../../../providers/bitpay/bitpay';
import { BwcErrorProvider } from '../../../../providers/bwc-error/bwc-error';
import { ConfigProvider } from '../../../../providers/config/config';
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { FeeProvider } from '../../../../providers/fee/fee';
import { OnGoingProcessProvider } from "../../../../providers/on-going-process/on-going-process";
import { PlatformProvider } from '../../../../providers/platform/platform';
import { PopupProvider } from '../../../../providers/popup/popup';
import { ProfileProvider } from '../../../../providers/profile/profile';
import { TxFormatProvider } from '../../../../providers/tx-format/tx-format';
import { WalletProvider } from '../../../../providers/wallet/wallet';

const FEE_TOO_HIGH_LIMIT_PER = 15;

@Component({
  selector: 'page-bitpay-card-topup',
  templateUrl: 'bitpay-card-topup.html',
})
export class BitPayCardTopUpPage {

  public coin: string;
  public cardId;
  public useSendMax: boolean;
  public amount;
  public currency;
  public message;
  public isCordova;
  public wallets;

  public totalAmountStr;
  public invoiceFee;
  public networkFee;
  public totalAmount;
  public wallet;
  public currencyIsoCode;
  public amountUnitStr;
  public lastFourDigits;
  public currencySymbol;
  public rate;

  private createdTx;
  private configWallet: any;

  constructor(
    private bitPayCardProvider: BitPayCardProvider,
    private bitPayProvider: BitPayProvider,
    private bwcErrorProvider: BwcErrorProvider,
    private configProvider: ConfigProvider,
    private events: Events,
    private externalLinkProvider: ExternalLinkProvider,
    private logger: Logger,
    private modalCtrl: ModalController,
    private navCtrl: NavController,
    private navParams: NavParams,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private popupProvider: PopupProvider,
    private profileProvider: ProfileProvider,
    private txFormatProvider: TxFormatProvider,
    private walletProvider: WalletProvider,
    private translate: TranslateService,
    private platformProvider: PlatformProvider,
    private feeProvider: FeeProvider
  ) {
    this.coin = 'btc';
    this.configWallet = this.configProvider.get().wallet;
    this.isCordova = this.platformProvider.isCordova;
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad BitPayCardTopUpPage');
  }

  ionViewWillEnter() {
    this.cardId = this.navParams.data.id;
    this.useSendMax = this.navParams.data.useSendMax;
    this.currency = this.navParams.data.currency;
    this.amount = this.navParams.data.amount;

    this.bitPayCardProvider.get({
      cardId: this.cardId,
      noRefresh: true
    }, (err, card) => {
      if (err) {
        this.showErrorAndBack(null, err);
        return;
      }
      this.bitPayCardProvider.setCurrencySymbol(card[0]);
      this.lastFourDigits = card[0].lastFourDigits;
      this.currencySymbol = card[0].currencySymbol;
      this.currencyIsoCode = card[0].currency;

      this.wallets = this.profileProvider.getWallets({
        onlyComplete: true,
        network: this.bitPayProvider.getEnvironment().network,
        hasFunds: true,
        coin: this.coin
      });

      if (_.isEmpty(this.wallets)) {
        this.showErrorAndBack(null, this.translate.instant('No wallets available'));
        return;
      }

      this.bitPayCardProvider.getRates(this.currencyIsoCode, (err, r) => {
        if (err) this.logger.error(err);
        this.rate = r.rate;
      });

      this.onWalletSelect(this.wallets[0]); // Default first wallet
    });
  }

  private _resetValues() {
    this.totalAmountStr = this.amount = this.invoiceFee = this.networkFee = this.totalAmount = this.wallet = null;
    this.createdTx = this.message = null;
  }

  private showErrorAndBack(title: string, msg: any) {
    title = title ? title : this.translate.instant('Error');
    this.logger.error(msg);
    msg = (msg && msg.errors) ? msg.errors[0].message : msg;
    this.popupProvider.ionicAlert(title, msg).then(() => {
      this.navCtrl.pop();
    });
  }

  private showError(title: string, msg: any): Promise<any> {
    return new Promise((resolve, reject) => {
      title = title || this.translate.instant('Error');
      this.logger.error(msg);
      msg = (msg && msg.errors) ? msg.errors[0].message : msg;
      this.popupProvider.ionicAlert(title, msg).then(() => {
        return resolve();
      });
    });
  }

  private satToFiat(sat: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.txFormatProvider.toFiat(this.coin, sat, this.currencyIsoCode).then((value: string) => {
        return resolve(value);
      });
    });
  }

  private publishAndSign(wallet: any, txp: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!wallet.canSign() && !wallet.isPrivKeyExternal()) {
        let err = this.translate.instant('No signing proposal: No private key');
        this.logger.info(err);
        return reject(err);
      }

      this.walletProvider.publishAndSign(wallet, txp).then((txp: any) => {
        this.onGoingProcessProvider.clear();
        return resolve(txp);
      }).catch((err: any) => {
        this.onGoingProcessProvider.clear();
        return reject(err);
      });
    });
  }

  private setTotalAmount(amountSat: number, invoiceFeeSat: number, networkFeeSat: number) {
    this.satToFiat(amountSat).then((a: string) => {
      this.amount = Number(a);

      this.satToFiat(invoiceFeeSat).then((i: string) => {
        this.invoiceFee = Number(i);

        this.satToFiat(networkFeeSat).then((n: string) => {
          this.networkFee = Number(n);
          this.totalAmount = this.amount + this.invoiceFee + this.networkFee;
        });
      });
    });
  }

  private createInvoice(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.bitPayCardProvider.topUp(this.cardId, data, (err: any, invoiceId: any) => {
        if (err) {
          return reject({
            title: 'Could not create the invoice',
            message: err
          });
        }

        this.bitPayCardProvider.getInvoice(invoiceId, (err: any, inv: any) => {
          if (err) {
            return reject({
              title: 'Could not get the invoice',
              message: err
            });
          }
          return resolve(inv);
        });
      });
    });
  }

  private createTx(wallet: any, invoice: any, message: string): Promise<any> {
    return new Promise((resolve, reject) => {
      let payProUrl = (invoice && invoice.paymentUrls) ? invoice.paymentUrls.BIP73 : null;

      if (!payProUrl) {
        return reject({
          title: this.translate.instant('Error in Payment Protocol'),
          message: this.translate.instant('Invalid URL')
        });
      }

      let outputs = [];
      let toAddress = invoice.bitcoinAddress;
      let amountSat = parseInt((invoice.btcDue * 100000000).toFixed(0), 10); // BTC to Satoshi

      outputs.push({
        'toAddress': toAddress,
        'amount': amountSat,
        'message': message
      });

      let txp = {
        toAddress,
        amount: amountSat,
        outputs,
        message,
        payProUrl,
        excludeUnconfirmedUtxos: this.configWallet.spendUnconfirmed ? false : true,
        feeLevel: this.configWallet.settings.feeLevel ? this.configWallet.settings.feeLevel : 'normal'
      };

      this.walletProvider.createTx(wallet, txp).then((ctxp: any) => {
        return resolve(ctxp);
      }).catch((err: any) => {
        return reject({
          title: this.translate.instant('Could not create transaction'),
          message: this.bwcErrorProvider.msg(err)
        });
      });
    });
  }

  private getSendMaxInfo(wallet: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.feeProvider.getCurrentFeeRate(wallet.coin, wallet.credentials.network).then((feePerKb) => {
        this.walletProvider.getSendMaxInfo(wallet, {
          feePerKb,
          excludeUnconfirmedUtxos: !this.configWallet.spendUnconfirmed,
          returnInputs: true
        }).then((resp) => {
          return resolve({
            sendMax: true,
            amount: resp.amount,
            inputs: resp.inputs,
            fee: resp.fee,
            feePerKb,
          });
        }).catch((err) => {
          return reject(err);
        });
      }).catch((err) => {
        return reject(err);
      });
    });
  }

  private calculateAmount(wallet: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // Global variables defined beforeEnter
      let a = this.amount;
      let c = this.currency;

      if (this.useSendMax) {
        this.getSendMaxInfo(wallet).then((maxValues) => {
          if (maxValues.amount == 0) {
            return reject({
              message: this.translate.instant('Insufficient funds for fee')
            });
          }

          let maxAmountBtc = Number((maxValues.amount / 100000000).toFixed(8));

          this.createInvoice({
            amount: maxAmountBtc,
            currency: 'BTC'
          }).then((inv) => {
            let invoiceFeeSat = parseInt((inv.buyerPaidBtcMinerFee * 100000000).toFixed(), 10);
            let newAmountSat = maxValues.amount - invoiceFeeSat;

            if (newAmountSat <= 0) {
              return reject({
                message: this.translate.instant('Insufficient funds for fee')
              });
            }

            return resolve({ amount: newAmountSat, currency: 'sat' });
          });
        }).catch((err) => {
          return reject({
            title: null,
            message: err
          });
        });
      } else {
        return resolve({ amount: a, currency: c });
      }
    });
  }

  private checkFeeHigh(amount: number, fee: number) {
    let per = fee / (amount + fee) * 100;

    if (per > FEE_TOO_HIGH_LIMIT_PER) {
      let feeWarningModal = this.modalCtrl.create(FeeWarningPage, {}, { showBackdrop: false, enableBackdropDismiss: false });
      feeWarningModal.present();
    }
  }

  private initializeTopUp(wallet: any, parsedAmount: any): void {
    this.amountUnitStr = parsedAmount.amountUnitStr;
    var dataSrc = {
      amount: parsedAmount.amount,
      currency: parsedAmount.currency
    };
    this.onGoingProcessProvider.set('loadingTxInfo');
    this.createInvoice(dataSrc).then((invoice) => {
      // Sometimes API does not return this element;
      invoice['buyerPaidBtcMinerFee'] = invoice.buyerPaidBtcMinerFee || 0;
      let invoiceFeeSat = (invoice.buyerPaidBtcMinerFee * 100000000).toFixed();

      this.message = this.translate.instant("Top up {{amountStr}} to debit card ({{cardLastNumber}})", {
        amountStr: this.amountUnitStr,
        cardLastNumber: this.lastFourDigits
      });

      this.createTx(wallet, invoice, this.message).then((ctxp) => {
        this.onGoingProcessProvider.clear();

        // Save TX in memory
        this.createdTx = ctxp;

        this.totalAmountStr = this.txFormatProvider.formatAmountStr(this.coin, ctxp.amount);

        // Warn: fee too high
        this.checkFeeHigh(Number(parsedAmount.amountSat), Number(invoiceFeeSat) + Number(ctxp.fee));

        this.setTotalAmount(parsedAmount.amountSat, Number(invoiceFeeSat), ctxp.fee);

      }).catch((err) => {
        this.onGoingProcessProvider.clear();
        this._resetValues();
        this.showError(err.title, err.message);
      });
    }).catch((err) => {
      this.onGoingProcessProvider.clear();
      this.showErrorAndBack(err.title, err.message);
    });
  };

  public topUpConfirm(): void {

    if (!this.createdTx) {
      this.showError(null, this.translate.instant('Transaction has not been created'));
      return;
    }

    let title = this.translate.instant('Confirm');
    let okText = this.translate.instant('OK');
    let cancelText = this.translate.instant('Cancel');
    this.popupProvider.ionicConfirm(title, this.message, okText, cancelText).then((ok) => {
      if (!ok) {
        return;
      }

      this.onGoingProcessProvider.set('topup');
      this.publishAndSign(this.wallet, this.createdTx).then((txSent) => {
        this.onGoingProcessProvider.clear();
        this.openFinishModal();
      }).catch((err) => {
        this.onGoingProcessProvider.clear();
        this._resetValues();
        this.showError(this.translate.instant('Could not send transaction'), err);
      });
    });
  };

  public onWalletSelect(wallet: any): void {
    this.wallet = wallet;
    this.onGoingProcessProvider.set('retrievingInputs');
    this.calculateAmount(this.wallet).then((val: any) => {
      let parsedAmount = this.txFormatProvider.parseAmount(this.coin, val.amount, val.currency);
      this.initializeTopUp(this.wallet, parsedAmount);
    }).catch((err) => {
      this.onGoingProcessProvider.clear();
      this._resetValues();
      this.showError(err.title, err.message).then(() => {
        this.showWallets();
      });
    });
  }

  public showWallets(): void {
    let id = this.wallet ? this.wallet.credentials.walletId : null;
    this.events.publish('showWalletsSelectorEvent', this.wallets, id, 'From');
    this.events.subscribe('selectWalletEvent', (wallet: any) => {
      if (!_.isEmpty(wallet)) this.onWalletSelect(wallet);
      this.events.unsubscribe('selectWalletEvent');
    });
  }

  private openFinishModal(): void {
    const finishComment = this.wallet.credentials.m === 1
      ? this.translate.instant('Funds were added to debit card')
      : this.translate.instant('Transaction initiated');
    let finishText = '';
    let modal = this.modalCtrl.create(FinishModalPage, { finishText, finishComment }, { showBackdrop: true, enableBackdropDismiss: false });
    modal.present();
    modal.onDidDismiss(() => {
      this.navCtrl.popToRoot({ animate: false });
      this.navCtrl.push(BitPayCardPage, { id: this.cardId });
    });
  }

  public openExternalLink(url: string) {
    this.externalLinkProvider.open(url);
  }

}
