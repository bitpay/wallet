import { Component, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  Events,
  ModalController,
  NavController,
  NavParams
} from 'ionic-angular';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Logger } from '../../../../providers/logger/logger';

// Components
import { CustomModalComponent } from '../../../../components/custom-modal/custom-modal';

// Pages
import { FinishModalPage } from '../../../finish/finish';
import { AmazonPage } from '../amazon';

// Provider
import { AmazonProvider } from '../../../../providers/amazon/amazon';
import { BwcErrorProvider } from '../../../../providers/bwc-error/bwc-error';
import { BwcProvider } from '../../../../providers/bwc/bwc';
import { ConfigProvider } from '../../../../providers/config/config';
import { EmailNotificationsProvider } from '../../../../providers/email-notifications/email-notifications';
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { OnGoingProcessProvider } from '../../../../providers/on-going-process/on-going-process';
import { PayproProvider } from '../../../../providers/paypro/paypro';
import { PlatformProvider } from '../../../../providers/platform/platform';
import { PopupProvider } from '../../../../providers/popup/popup';
import { ProfileProvider } from '../../../../providers/profile/profile';
import { ReplaceParametersProvider } from '../../../../providers/replace-parameters/replace-parameters';
import { TxFormatProvider } from '../../../../providers/tx-format/tx-format';
import { WalletProvider } from '../../../../providers/wallet/wallet';

@Component({
  selector: 'page-buy-amazon',
  templateUrl: 'buy-amazon.html'
})
export class BuyAmazonPage {
  @ViewChild('slideButton') slideButton;

  private bitcoreCash: any;
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
  public amazonGiftCard: any;
  public amountUnitStr: string;
  public limitPerDayMessage: string;
  public network: string;
  public walletSelectorTitle: string;
  public isOpenSelector: boolean;

  // Platform info
  public isCordova: boolean;

  constructor(
    private amazonProvider: AmazonProvider,
    private bwcErrorProvider: BwcErrorProvider,
    private bwcProvider: BwcProvider,
    private configProvider: ConfigProvider,
    private replaceParametersProvider: ReplaceParametersProvider,
    private emailNotificationsProvider: EmailNotificationsProvider,
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
    private payproProvider: PayproProvider,
    private platformProvider: PlatformProvider
  ) {
    this.FEE_TOO_HIGH_LIMIT_PER = 15;
    this.configWallet = this.configProvider.get().wallet;
    this.amazonGiftCard = null;
    this.bitcoreCash = this.bwcProvider.getBitcoreCash();
    this.isCordova = this.platformProvider.isCordova;
  }

  ionViewWillLeave() {
    this.navCtrl.swipeBackEnabled = true;
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad BuyAmazonPage');
  }

  ionViewWillEnter() {
    this.isOpenSelector = false;
    this.navCtrl.swipeBackEnabled = false;
    this.amount = this.navParams.data.amount;
    this.currency = this.navParams.data.currency;

    let limitPerDay = this.amazonProvider.limitPerDay;

    this.limitPerDayMessage = this.replaceParametersProvider.replace(
      this.translate.instant(
        'Purchase Amount is limited to {{limitPerDay}} {{currency}} per day'
      ),
      { limitPerDay, currency: this.currency }
    );

    if (this.amount > this.amazonProvider.limitPerDay) {
      this.showErrorAndBack(null, this.limitPerDayMessage);
      return;
    }

    this.network = this.amazonProvider.getNetwork();
    this.wallets = this.profileProvider.getWallets({
      onlyComplete: true,
      network: this.network,
      hasFunds: true
    });
    if (_.isEmpty(this.wallets)) {
      this.showErrorAndBack(
        null,
        this.translate.instant('No wallets available')
      );
      return;
    }
    this.showWallets(); // Show wallet selector
  }

  private checkFeeHigh(amount: number, fee: number) {
    let per = (fee / (amount + fee)) * 100;

    if (per > this.FEE_TOO_HIGH_LIMIT_PER) {
      let feeWarningModal = this.modalCtrl.create(
        CustomModalComponent,
        { modal: 'fee-warning' },
        { cssClass: 'fullscreen-modal' }
      );
      feeWarningModal.present();
    }
  }

  public openExternalLink(url: string) {
    this.externalLinkProvider.open(url);
  }

  private _resetValues() {
    this.totalAmountStr = this.invoiceFee = this.networkFee = this.totalAmount = this.wallet = null;
    this.createdTx = this.message = this.invoiceId = null;
  }

  private showErrorAndBack(title: string, msg: any) {
    if (this.isCordova) this.slideButton.isConfirmed(false);
    title = title ? title : this.translate.instant('Error');
    this.logger.error(msg);
    msg = msg && msg.errors ? msg.errors[0].message : msg;
    this.popupProvider.ionicAlert(title, msg).then(() => {
      this.navCtrl.pop();
    });
  }

  private showError = function(title: string, msg: any): Promise<any> {
    return new Promise(resolve => {
      if (this.isCordova) this.slideButton.isConfirmed(false);
      title = title || this.translate.instant('Error');
      this.logger.error(msg);
      msg = msg && msg.errors ? msg.errors[0].message : msg;
      this.popupProvider.ionicAlert(title, msg).then(() => {
        return resolve();
      });
    });
  };

  private publishAndSign(wallet: any, txp: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!wallet.canSign() && !wallet.isPrivKeyExternal()) {
        let err = this.translate.instant('No signing proposal: No private key');
        return reject(err);
      }

      this.walletProvider
        .publishAndSign(wallet, txp)
        .then((txp: any) => {
          this.onGoingProcessProvider.clear();
          return resolve(txp);
        })
        .catch((err: any) => {
          this.onGoingProcessProvider.clear();
          return reject(err);
        });
    });
  }

  private satToFiat(coin: string, sat: number): Promise<any> {
    return new Promise(resolve => {
      this.txFormatProvider
        .toFiat(coin, sat, this.currencyIsoCode)
        .then((value: string) => {
          return resolve(value);
        });
    });
  }

  private setTotalAmount(
    wallet: any,
    amountSat: number,
    invoiceFeeSat: number,
    networkFeeSat: number
  ) {
    this.satToFiat(wallet.coin, amountSat).then((a: string) => {
      this.amount = Number(a);

      this.satToFiat(wallet.coin, invoiceFeeSat).then((i: string) => {
        this.invoiceFee = Number(i);

        this.satToFiat(wallet.coin, networkFeeSat).then((n: string) => {
          this.networkFee = Number(n);
          this.totalAmount = this.amount + this.invoiceFee + this.networkFee;
        });
      });
    });
  }

  private isCryptoCurrencySupported(wallet: any, invoice: any) {
    let COIN = wallet.coin.toUpperCase();
    if (!invoice['supportedTransactionCurrencies'][COIN]) return false;
    return invoice['supportedTransactionCurrencies'][COIN].enabled;
  }

  private createInvoice(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.amazonProvider.createBitPayInvoice(
        data,
        (err: any, dataInvoice: any) => {
          if (err) {
            let err_title = this.translate.instant(
              'Error creating the invoice'
            );
            let err_msg;
            if (err && err.message && err.message.match(/suspended/i)) {
              err_title = this.translate.instant('Service not available');
              err_msg = this.translate.instant(
                'Amazon.com is not available at this moment. Please try back later.'
              );
            } else if (err && err.message) {
              err_msg = err.message;
            } else {
              err_msg = this.translate.instant(
                'Could not access to Amazon.com'
              );
            }

            return reject({
              title: err_title,
              message: err_msg
            });
          }

          let accessKey = dataInvoice ? dataInvoice.accessKey : null;

          if (!accessKey) {
            return reject({
              message: this.translate.instant('No access key defined')
            });
          }

          this.amazonProvider.getBitPayInvoice(
            dataInvoice.invoiceId,
            (err: any, invoice: any) => {
              if (err) {
                return reject({
                  message: this.translate.instant('Could not get the invoice')
                });
              }

              return resolve({ invoice, accessKey });
            }
          );
        }
      );
    });
  }

  private createTx(wallet: any, invoice: any, message: string): Promise<any> {
    let COIN = wallet.coin.toUpperCase();
    return new Promise((resolve, reject) => {
      let payProUrl =
        invoice && invoice.paymentCodes
          ? invoice.paymentCodes[COIN].BIP73
          : null;

      if (!payProUrl) {
        return reject({
          title: this.translate.instant('Error in Payment Protocol'),
          message: this.translate.instant('Invalid URL')
        });
      }

      this.payproProvider
        .getPayProDetails(payProUrl, wallet.coin)
        .then((details: any) => {
          let txp: any = {
            amount: details.amount,
            toAddress: details.toAddress,
            outputs: [
              {
                toAddress: details.toAddress,
                amount: details.amount,
                message
              }
            ],
            message,
            customData: {
              service: 'amazon'
            },
            payProUrl,
            excludeUnconfirmedUtxos: this.configWallet.spendUnconfirmed
              ? false
              : true
          };

          if (details.requiredFeeRate) {
            txp.feePerKb = Math.ceil(details.requiredFeeRate * 1024);
            this.logger.debug(
              'Using merchant fee rate (for amazon gc):' + txp.feePerKb
            );
          } else {
            txp.feeLevel = this.configWallet.settings.feeLevel || 'normal';
          }

          txp['origToAddress'] = txp.toAddress;

          if (wallet.coin && wallet.coin == 'bch') {
            // Use legacy address
            txp.toAddress = this.bitcoreCash.Address(txp.toAddress).toString();
            txp.outputs[0].toAddress = txp.toAddress;
          }

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
        })
        .catch(() => {
          return reject({
            title: this.translate.instant('Error in Payment Protocol'),
            message: this.translate.instant('Invalid URL')
          });
        });
    });
  }

  private checkTransaction = _.throttle(
    (count: number, dataSrc: any) => {
      this.amazonProvider.createGiftCard(dataSrc, (err, giftCard) => {
        this.logger.debug('creating gift card ' + count);
        if (err) {
          giftCard = giftCard || {};
          giftCard['status'] = 'FAILURE';
        }

        let now = moment().unix() * 1000;

        let newData = giftCard;
        newData.invoiceId = dataSrc.invoiceId;
        newData.accessKey = dataSrc.accessKey;
        newData.invoiceUrl = dataSrc.invoiceUrl;
        newData.amount = dataSrc.amount;
        newData.date = dataSrc.invoiceTime || now;
        newData.uuid = dataSrc.uuid;

        if (newData.status == 'expired') {
          this.amazonProvider.savePendingGiftCard(
            newData,
            {
              remove: true
            },
            (err: any) => {
              this.logger.error(err);
              this.onGoingProcessProvider.clear();
              this.showError(null, this.translate.instant('Gift card expired'));
            }
          );
          return;
        }

        if (giftCard.status == 'PENDING' && count < 3) {
          this.logger.debug('Waiting for payment confirmation');
          this.amazonProvider.savePendingGiftCard(newData, null, () => {
            this.logger.debug(
              'Saving gift card with status: ' + newData.status
            );
          });
          this.checkTransaction(count + 1, dataSrc);
          return;
        }

        this.amazonProvider.savePendingGiftCard(newData, null, () => {
          this.onGoingProcessProvider.clear();
          this.logger.debug(
            'Saved new gift card with status: ' + newData.status
          );
          this.amazonGiftCard = newData;
          this.openFinishModal();
        });
      });
    },
    15000,
    {
      leading: true
    }
  );

  private initialize(wallet: any): void {
    let COIN = wallet.coin.toUpperCase();
    let email = this.emailNotificationsProvider.getEmailIfEnabled();
    let parsedAmount = this.txFormatProvider.parseAmount(
      wallet.coin,
      this.amount,
      this.currency
    );
    this.currencyIsoCode = parsedAmount.currency;
    this.amountUnitStr = parsedAmount.amountUnitStr;
    let dataSrc = {
      amount: parsedAmount.amount,
      currency: parsedAmount.currency,
      uuid: wallet.id,
      email,
      buyerSelectedTransactionCurrency: COIN
    };
    this.onGoingProcessProvider.set('loadingTxInfo');

    this.createInvoice(dataSrc)
      .then((data: any) => {
        let invoice = data.invoice;
        let accessKey = data.accessKey;

        if (!this.isCryptoCurrencySupported(wallet, invoice)) {
          this.onGoingProcessProvider.clear();
          let msg = this.translate.instant(
            'Purchases with this cryptocurrency is not enabled'
          );
          this.showErrorAndBack(null, msg);
          return;
        }

        // Sometimes API does not return this element;
        invoice['minerFees'][COIN]['totalFee'] =
          invoice.minerFees[COIN].totalFee || 0;
        let invoiceFeeSat = invoice.minerFees[COIN].totalFee;

        this.message = this.replaceParametersProvider.replace(
          this.translate.instant('{{amountUnitStr}} Gift Card'),
          { amountUnitStr: this.amountUnitStr }
        );

        this.createTx(wallet, invoice, this.message)
          .then((ctxp: any) => {
            this.onGoingProcessProvider.clear();

            // Save in memory
            this.createdTx = ctxp;
            this.invoiceId = invoice.id;

            this.createdTx.giftData = {
              currency: dataSrc.currency,
              amount: dataSrc.amount,
              uuid: dataSrc.uuid,
              accessKey,
              invoiceId: invoice.id,
              invoiceUrl: invoice.url,
              invoiceTime: invoice.invoiceTime
            };
            this.totalAmountStr = this.txFormatProvider.formatAmountStr(
              wallet.coin,
              ctxp.amount
            );

            // Warn: fee too high
            this.checkFeeHigh(
              Number(parsedAmount.amountSat),
              Number(invoiceFeeSat) + Number(ctxp.fee)
            );

            this.setTotalAmount(
              wallet,
              parsedAmount.amountSat,
              invoiceFeeSat,
              ctxp.fee
            );
          })
          .catch((err: any) => {
            this.onGoingProcessProvider.clear();
            this._resetValues();
            this.showError(err.title, err.message);
            return;
          });
      })
      .catch((err: any) => {
        this.onGoingProcessProvider.clear();
        this.showErrorAndBack(err.title, err.message);
        return;
      });
  }

  public buyConfirm() {
    if (!this.createdTx) {
      this.showError(
        null,
        this.translate.instant('Transaction has not been created')
      );
      return;
    }
    let title = this.translate.instant('Confirm');
    let okText = this.translate.instant('OK');
    let cancelText = this.translate.instant('Cancel');
    this.popupProvider
      .ionicConfirm(title, this.message, okText, cancelText)
      .then(ok => {
        if (!ok) {
          if (this.isCordova) this.slideButton.isConfirmed(false);
          return;
        }

        this.publishAndSign(this.wallet, this.createdTx)
          .then(() => {
            this.onGoingProcessProvider.set('buyingGiftCard');
            this.checkTransaction(1, this.createdTx.giftData);
          })
          .catch((err: any) => {
            this._resetValues();
            this.showError(
              this.translate.instant('Could not send transaction'),
              this.bwcErrorProvider.msg(err)
            );
            return;
          });
      });
  }

  public onWalletSelect(wallet: any): void {
    this.wallet = wallet;
    this.initialize(wallet);
  }

  public showWallets(): void {
    this.isOpenSelector = true;
    let id = this.wallet ? this.wallet.credentials.walletId : null;
    this.events.publish(
      'showWalletsSelectorEvent',
      this.wallets,
      id,
      'Buy from'
    );
    this.events.subscribe('selectWalletEvent', (wallet: any) => {
      if (!_.isEmpty(wallet)) this.onWalletSelect(wallet);
      this.events.unsubscribe('selectWalletEvent');
      this.isOpenSelector = false;
    });
  }

  private openFinishModal(): void {
    let finishComment: string;
    let cssClass: string;
    if (this.amazonGiftCard.status == 'FAILURE') {
      finishComment = 'Your purchase could not be completed';
      cssClass = 'danger';
    }
    if (this.amazonGiftCard.status == 'PENDING') {
      finishComment = 'Your purchase was added to the list of pending';
      cssClass = 'warning';
    }
    if (this.amazonGiftCard.status == 'SUCCESS') {
      finishComment = 'Bought ' + this.amountUnitStr;
    }
    if (this.amazonGiftCard.status == 'SUCCESS') {
      finishComment = 'Gift card generated and ready to use.';
    }
    let finishText = '';
    let modal = this.modalCtrl.create(
      FinishModalPage,
      { finishText, finishComment, cssClass },
      { showBackdrop: true, enableBackdropDismiss: false }
    );
    modal.present();
    modal.onDidDismiss(async () => {
      await this.navCtrl.popToRoot({ animate: false });
      await this.navCtrl.parent.select(0);
      await this.navCtrl.push(
        AmazonPage,
        { invoiceId: this.invoiceId },
        { animate: false }
      );
    });
  }
}
