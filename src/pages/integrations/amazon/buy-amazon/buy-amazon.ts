import { Component } from '@angular/core';
import { NavController, NavParams, ModalController, ActionSheetController } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';
import * as _ from 'lodash';
import * as moment from 'moment';

// Pages
import { FeeWarningPage } from '../../../../pages/send/fee-warning/fee-warning';
import { AmazonCardsPage } from '../../../../pages/integrations/amazon/amazon-cards/amazon-cards';

// Provider
import { AmazonProvider } from '../../../../providers/amazon/amazon';
import { BwcErrorProvider } from '../../../../providers/bwc-error/bwc-error';
import { ConfigProvider } from '../../../../providers/config/config';
import { EmailNotificationsProvider } from '../../../../providers/email-notifications/email-notifications';
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { OnGoingProcessProvider } from "../../../../providers/on-going-process/on-going-process";
import { PopupProvider } from '../../../../providers/popup/popup';
import { ProfileProvider } from '../../../../providers/profile/profile';
import { TxFormatProvider } from '../../../../providers/tx-format/tx-format';
import { WalletProvider } from '../../../../providers/wallet/wallet';

@Component({
  selector: 'page-buy-amazon',
  templateUrl: 'buy-amazon.html',
})
export class BuyAmazonPage {

  private coin: string;
  private amount: number;
  private currency: string;
  private createdTx: any;
  private message: string;
  private invoiceId: string;
  private configWallet: any;
  private currencyIsoCode: string;
  private FEE_TOO_HIGH_LIMIT_PER: number;

  public wallet: any;
  public wallets: any;
  public totalAmountStr: string;
  public invoiceFee: number;
  public networkFee: number;
  public totalAmount: number;
  public sendStatus: string;
  public amazonGiftCard: any;
  public amountUnitStr: string;
  public limitPerDayMessage: string;
  public network: string;
  public walletSelectorTitle: string;

  constructor(
    private actionSheetCtrl: ActionSheetController,
    private amazonProvider: AmazonProvider,
    private bwcErrorProvider: BwcErrorProvider,
    private configProvider: ConfigProvider,
    private emailNotificationsProvider: EmailNotificationsProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private logger: Logger,
    private modalCtrl: ModalController,
    private navCtrl: NavController,
    private navParams: NavParams,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private popupProvider: PopupProvider,
    private profileProvider: ProfileProvider,
    private txFormatProvider: TxFormatProvider,
    private walletProvider: WalletProvider
  ) {
    this.FEE_TOO_HIGH_LIMIT_PER = 15;
    this.coin = 'btc';
    this.configWallet = this.configProvider.get().wallet;
    this.amazonGiftCard = null;
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad BuyAmazonPage');
  }

  ionViewWillEnter() {
    this.amount = this.navParams.data.amountFiat;
    this.currency = this.navParams.data.currency.toUpperCase();

    let limitPerDay = this.amazonProvider.limitPerDay;

    this.limitPerDayMessage = "Purchase Amount is limited to " + limitPerDay + " " + this.currency + " per day"; // TODO: gettextCatalog

    if (this.amount > this.amazonProvider.limitPerDay) {
      this.showErrorAndBack(null, this.limitPerDayMessage);
      return;
    }

    this.network = this.amazonProvider.getNetwork();
    this.wallets = this.profileProvider.getWallets({
      onlyComplete: true,
      network: this.network,
      hasFunds: true,
      coin: this.coin
    });
    if (_.isEmpty(this.wallets)) {
      this.showErrorAndBack(null, 'No wallets available'); // TODO: gettextCatalog
      return;
    }
    this.onWalletSelect(this.wallets[0]); // Default first wallet
  }

  private checkFeeHigh(amount: number, fee: number) {
    let per = fee / (amount + fee) * 100;

    if (per > this.FEE_TOO_HIGH_LIMIT_PER) {
      let feeWarningModal = this.modalCtrl.create(FeeWarningPage, {}, { showBackdrop: false, enableBackdropDismiss: false });
      feeWarningModal.present();
    }
  }

  public openExternalLink(url: string) {
    this.externalLinkProvider.open(url);
  }

  private _resetValues() {
    this.totalAmountStr = this.amount = this.invoiceFee = this.networkFee = this.totalAmount = this.wallet = null;
    this.createdTx = this.message = this.invoiceId = null;
  }

  private showErrorAndBack(title: string, msg: any) {
    title = title ? title : 'Error'; // TODO: gettextCatalog
    this.sendStatus = '';
    this.logger.error(msg);
    msg = (msg && msg.errors) ? msg.errors[0].message : msg;
    this.popupProvider.ionicAlert(title, msg).then(() => {
      this.navCtrl.pop();
    });
  }

  private showError = function (title: string, msg: any): Promise<any> {
    return new Promise((resolve, reject) => {
      title = title || 'Error'; // TODO: gettextCatalog
      this.sendStatus = '';
      this.logger.error(msg);
      msg = (msg && msg.errors) ? msg.errors[0].message : msg;
      this.popupProvider.ionicAlert(title, msg).then(() => {
        return resolve();
      });
    });
  }

  private publishAndSign(wallet: any, txp: any, onSendStatusChange: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!wallet.canSign() && !wallet.isPrivKeyExternal()) {
        let err = 'No signing proposal: No private key'; // TODO: gettextCatalog
        this.logger.info(err);
        return reject(err);
      }

      this.walletProvider.publishAndSign(wallet, txp, onSendStatusChange).then((txp: any) => {
        return resolve(txp);
      }).catch((err: any) => {
        return reject(err);
      });
    });
  }

  private statusChangeHandler(processName: string, isOn: boolean) {
    let showName = this.onGoingProcessProvider.getShowName(processName);
    this.logger.debug('statusChangeHandler: ', processName, showName, isOn);
    if (processName == 'buyingGiftCard' && !isOn) {
      this.sendStatus = 'success';
    } else if (showName) {
      this.sendStatus = showName;
    }
  }

  private satToFiat(sat: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.txFormatProvider.toFiat(this.coin, sat, this.currencyIsoCode).then((value: string) => {
        return resolve(value);
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
      this.amazonProvider.createBitPayInvoice(data, (err: any, dataInvoice: any) => {
        if (err) {
          let err_title = 'Error creating the invoice'; // TODO: gettextCatalog
          let err_msg;
          if (err && err.message && err.message.match(/suspended/i)) {
            err_title = 'Service not available'; // TODO: gettextCatalog
            err_msg = 'Amazon.com is not available at this moment. Please try back later.'; // TODO: gettextCatalog
          } else if (err && err.message) {
            err_msg = err.message;
          } else {
            err_msg = 'Could not access to Amazon.com'; // TODO: gettextCatalog
          };

          return reject({
            title: err_title,
            message: err_msg
          });
        }

        let accessKey = dataInvoice ? dataInvoice.accessKey : null;

        if (!accessKey) {
          return reject({
            message: 'No access key defined' // TODO: gettextCatalog
          });
        }

        this.amazonProvider.getBitPayInvoice(dataInvoice.invoiceId, (err: any, invoice: any) => {
          if (err) {
            return reject({
              message: 'Could not get the invoice' // TODO: gettextCatalog
            });
          }

          return resolve({ invoice: invoice, accessKey: accessKey });
        });
      });
    });
  }

  private createTx(wallet: any, invoice: any, message: string): Promise<any> {
    return new Promise((resolve, reject) => {
      let payProUrl = (invoice && invoice.paymentUrls) ? invoice.paymentUrls.BIP73 : null;

      if (!payProUrl) {
        return reject({
          title: 'Error in Payment Protocol', // TODO: gettextCatalog
          message: 'Invalid URL' // TODO: gettextCatalog
        });
      }

      let outputs = [];
      let toAddress = invoice.bitcoinAddress;
      let amountSat = parseInt((invoice.btcDue * 100000000).toFixed(0)); // BTC to Satoshi

      outputs.push({
        'toAddress': toAddress,
        'amount': amountSat,
        'message': message
      });

      let txp = {
        toAddress: toAddress,
        amount: amountSat,
        outputs: outputs,
        message: message,
        payProUrl: payProUrl,
        excludeUnconfirmedUtxos: this.configWallet.spendUnconfirmed ? false : true,
        feeLevel: this.configWallet.settings.feeLevel ? this.configWallet.settings.feeLevel : 'normal'
      };

      this.walletProvider.createTx(wallet, txp).then((ctxp: any) => {
        return resolve(ctxp);
      }).catch((err: any) => {
        return reject({
          title: 'Could not create transaction', // TODO: gettextCatalog
          message: this.bwcErrorProvider.msg(err)
        });
      });
    });
  }

  private checkTransaction = _.throttle((count: number, dataSrc: any) => {
    this.amazonProvider.createGiftCard(dataSrc, (err, giftCard) => {
      this.logger.debug("creating gift card " + count);
      if (err) {
        this.onGoingProcessProvider.set('buyingGiftCard', false);
        this.statusChangeHandler('buyingGiftCard', false);
        giftCard = {};
        giftCard.status = 'FAILURE';
        this.showError('Error creating gift card', err); // TODO: gettextCatalog
      }

      if (giftCard.status == 'PENDING' && count < 3) {
        this.logger.debug("Waiting for payment confirmation");
        this.checkTransaction(count + 1, dataSrc);
        return;
      }

      var now = moment().unix() * 1000;

      var newData = giftCard;
      newData.invoiceId = dataSrc.invoiceId;
      newData.accessKey = dataSrc.accessKey;
      newData.invoiceUrl = dataSrc.invoiceUrl;
      newData.amount = dataSrc.amount;
      newData.date = dataSrc.invoiceTime || now;
      newData.uuid = dataSrc.uuid;

      if (newData.status == 'expired') {
        this.amazonProvider.savePendingGiftCard(newData, {
          remove: true
        }, (err: any) => {
          this.logger.error(err);
          this.onGoingProcessProvider.set('buyingGiftCard', false);
          this.statusChangeHandler('buyingGiftCard', false);
          this.showError(null, 'Gift card expired'); // TODO: gettextCatalog
        });
        return;
      }

      this.amazonProvider.savePendingGiftCard(newData, null, (err: any) => {
        this.onGoingProcessProvider.set('buyingGiftCard', false);
        this.statusChangeHandler('buyingGiftCard', false);
        this.logger.debug("Saving new gift card with status: " + newData.status);
        this.amazonGiftCard = newData;
      });
    });
  }, 8000, {
      'leading': true
    });

  private initialize(wallet: any): void {
    let email = this.emailNotificationsProvider.getEmailIfEnabled();
    let parsedAmount = this.txFormatProvider.parseAmount(this.coin, this.amount, this.currency);
    this.currencyIsoCode = parsedAmount.currency;
    this.amountUnitStr = parsedAmount.amountUnitStr;
    let dataSrc = {
      amount: parsedAmount.amount,
      currency: parsedAmount.currency,
      uuid: wallet.id,
      email: email
    };
    this.onGoingProcessProvider.set('loadingTxInfo', true);

    this.createInvoice(dataSrc).then((data: any) => {
      let invoice = data.invoice;
      let accessKey = data.accessKey;

      // Sometimes API does not return this element;
      invoice['buyerPaidBtcMinerFee'] = invoice.buyerPaidBtcMinerFee || 0;
      let invoiceFeeSat = parseInt((invoice.buyerPaidBtcMinerFee * 100000000).toFixed());

      this.message = this.amountUnitStr + " for Amazon.com Gift Card"; // TODO: gettextCatalog

      this.createTx(wallet, invoice, this.message).then((ctxp: any) => {
        this.onGoingProcessProvider.set('loadingTxInfo', false);


        // Save in memory
        this.createdTx = ctxp;
        this.invoiceId = invoice.id;

        this.createdTx.giftData = {
          currency: dataSrc.currency,
          amount: dataSrc.amount,
          uuid: dataSrc.uuid,
          accessKey: accessKey,
          invoiceId: invoice.id,
          invoiceUrl: invoice.url,
          invoiceTime: invoice.invoiceTime
        };
        this.totalAmountStr = this.txFormatProvider.formatAmountStr(this.coin, ctxp.amount);

        // Warn: fee too high
        this.checkFeeHigh(Number(parsedAmount.amountSat), Number(invoiceFeeSat) + Number(ctxp.fee));

        this.setTotalAmount(parsedAmount.amountSat, invoiceFeeSat, ctxp.fee);
      }).catch((err: any) => {
        this.onGoingProcessProvider.set('loadingTxInfo', false);
        this._resetValues();
        this.showError(err.title, err.message);
        return;
      });
    }).catch((err: any) => {
      this.onGoingProcessProvider.set('loadingTxInfo', false);
      this.showErrorAndBack(err.title, err.message);
      return;
    });
  }

  public buyConfirm() {
    if (!this.createdTx) {
      this.showError(null, 'Transaction has not been created'); // TODO: gettextCatalog
      return;
    }
    var title = 'Confirm'; // TODO: gettextCatalog
    var okText = 'OK'; // TODO: gettextCatalog
    var cancelText = 'Cancel'; // TODO: gettextCatalog
    this.popupProvider.ionicConfirm(title, this.message, okText, cancelText).then((ok) => {
      if (!ok) {
        this.sendStatus = '';
        return;
      }

      this.publishAndSign(this.wallet, this.createdTx, function () { }).then((txSent) => {
        this.onGoingProcessProvider.set('buyingGiftCard', true);
        this.statusChangeHandler('buyingGiftCard', true);
        this.checkTransaction(1, this.createdTx.giftData);
      }).catch((err: any) => {
        this._resetValues();
        this.showError('Could not send transaction', err); // TODO: gettextCatalog
        return;
      });
    });
  }

  public onWalletSelect(wallet: any): void {
    this.wallet = wallet;
    this.initialize(wallet);
  }

  public goBackHome(): void {
    this.sendStatus = '';
    this.navCtrl.remove(3, 1);
    this.navCtrl.pop();
    this.navCtrl.push(AmazonCardsPage, { invoiceId: this.invoiceId });
  }

  public showWallets(): void {
    let buttons: Array<any> = [];

    _.each(this.wallets, (w: any) => {
      let walletButton: Object = {
        text: w.credentials.walletName,
        cssClass: 'wallet-' + w.network,
        icon: 'wallet',
        handler: () => {
          this.onWalletSelect(w);
        }
      }
      buttons.push(walletButton);
    });

    const actionSheet = this.actionSheetCtrl.create({
      title: 'Buy from',
      buttons: buttons
    });

    actionSheet.present();
  }

}
