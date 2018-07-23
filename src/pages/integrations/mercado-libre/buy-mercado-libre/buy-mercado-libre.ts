import { Component, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ModalController, NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Logger } from '../../../../providers/logger/logger';

// Pages
import { FinishModalPage } from '../../../finish/finish';
import { MercadoLibrePage } from '../mercado-libre';

// Provider
import { ActionSheetProvider } from '../../../../providers/action-sheet/action-sheet';
import { BwcErrorProvider } from '../../../../providers/bwc-error/bwc-error';
import { BwcProvider } from '../../../../providers/bwc/bwc';
import { ConfigProvider } from '../../../../providers/config/config';
import { EmailNotificationsProvider } from '../../../../providers/email-notifications/email-notifications';
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { MercadoLibreProvider } from '../../../../providers/mercado-libre/mercado-libre';
import { OnGoingProcessProvider } from '../../../../providers/on-going-process/on-going-process';
import { PayproProvider } from '../../../../providers/paypro/paypro';
import { PlatformProvider } from '../../../../providers/platform/platform';
import { PopupProvider } from '../../../../providers/popup/popup';
import { ProfileProvider } from '../../../../providers/profile/profile';
import { ReplaceParametersProvider } from '../../../../providers/replace-parameters/replace-parameters';
import { TxFormatProvider } from '../../../../providers/tx-format/tx-format';
import {
  TransactionProposal,
  WalletProvider
} from '../../../../providers/wallet/wallet';

@Component({
  selector: 'page-buy-mercado-libre',
  templateUrl: 'buy-mercado-libre.html'
})
export class BuyMercadoLibrePage {
  @ViewChild('slideButton') slideButton;

  private bitcoreCash;
  private amount: number;
  private currency: string;
  private createdTx;
  private message: string;
  private invoiceId: string;
  private configWallet;
  private currencyIsoCode: string;
  private FEE_TOO_HIGH_LIMIT_PER: number;

  public wallet;
  public wallets;
  public totalAmountStr: string;
  public invoiceFee: number;
  public networkFee: number;
  public totalAmount: number;
  public mlGiftCard;
  public amountUnitStr: string;
  public limitPerDayMessage: string;
  public network: string;
  public walletSelectorTitle: string;
  public isOpenSelector: boolean;

  // Platform info
  public isCordova: boolean;

  constructor(
    private actionSheetProvider: ActionSheetProvider,
    private mercadoLibreProvider: MercadoLibreProvider,
    private bwcErrorProvider: BwcErrorProvider,
    private bwcProvider: BwcProvider,
    private configProvider: ConfigProvider,
    private replaceParametersProvider: ReplaceParametersProvider,
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
    private walletProvider: WalletProvider,
    private translate: TranslateService,
    private payproProvider: PayproProvider,
    private platformProvider: PlatformProvider
  ) {
    this.FEE_TOO_HIGH_LIMIT_PER = 15;
    this.configWallet = this.configProvider.get().wallet;
    this.mlGiftCard = null;
    this.bitcoreCash = this.bwcProvider.getBitcoreCash();
    this.isCordova = this.platformProvider.isCordova;
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad BuyMercadoLibrePage');
  }

  ionViewWillLeave() {
    this.navCtrl.swipeBackEnabled = true;
  }

  ionViewWillEnter() {
    this.isOpenSelector = false;
    this.navCtrl.swipeBackEnabled = false;
    this.amount = this.navParams.data.amount;
    this.currency = this.navParams.data.currency;

    if (this.amount > 2000 || this.amount < 50) {
      this.showErrorAndBack(
        null,
        this.translate.instant(
          'Purchase amount must be a value between 50 and 2000'
        )
      );
      return;
    }

    this.network = this.mercadoLibreProvider.getNetwork();
    this.wallets = this.profileProvider.getWallets({
      onlyComplete: true,
      network: this.network,
      hasFunds: true,
      m: 1
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
      const feeWarningModal = this.popupProvider.createMiniModal('fee-warning');
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

  private showErrorAndBack(title: string, msg) {
    if (this.isCordova) this.slideButton.isConfirmed(false);
    title = title ? title : this.translate.instant('Error');
    this.logger.error(msg);
    msg = msg && msg.errors ? msg.errors[0].message : msg;
    this.popupProvider.ionicAlert(title, msg).then(() => {
      this.navCtrl.pop();
    });
  }

  private showError = function(title: string, msg): Promise<any> {
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

  private publishAndSign(wallet, txp): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!wallet.canSign() && !wallet.isPrivKeyExternal()) {
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
    wallet,
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

  private isCryptoCurrencySupported(wallet, invoice) {
    let COIN = wallet.coin.toUpperCase();
    if (!invoice['supportedTransactionCurrencies'][COIN]) return false;
    return invoice['supportedTransactionCurrencies'][COIN].enabled;
  }

  private createInvoice(data): Promise<any> {
    return new Promise((resolve, reject) => {
      this.mercadoLibreProvider.createBitPayInvoice(
        data,
        (err, dataInvoice) => {
          if (err) {
            let err_title = this.translate.instant(
              'Error creating the invoice'
            );
            let err_msg;
            if (err && err.message && err.message.match(/suspended/i)) {
              err_title = this.translate.instant('Service not available');
              err_msg = this.translate.instant(
                'Mercadolibre Gift Card Service is not available at this moment. Please try back later.'
              );
            } else if (err && err.message) {
              err_msg = err.message;
            } else {
              err_msg = this.translate.instant(
                'Could not access Gift Card Service'
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

          this.mercadoLibreProvider.getBitPayInvoice(
            dataInvoice.invoiceId,
            (err, invoice) => {
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

  private createTx(wallet, invoice, message: string): Promise<any> {
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
        .then(details => {
          let txp: Partial<TransactionProposal> = {
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
              service: 'mercadolibre'
            },
            payProUrl,
            excludeUnconfirmedUtxos: this.configWallet.spendUnconfirmed
              ? false
              : true
          };

          if (details.requiredFeeRate) {
            txp.feePerKb = Math.ceil(details.requiredFeeRate * 1024);
            this.logger.debug(
              'Using merchant fee rate (for mercadolibre gc):' + txp.feePerKb
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
    (count: number, dataSrc) => {
      this.mercadoLibreProvider.createGiftCard(dataSrc, (err, giftCard) => {
        this.logger.debug('creating gift card ' + count);
        if (err) {
          giftCard = giftCard || {};
          giftCard['status'] = 'FAILURE';
        }

        if (
          giftCard &&
          giftCard.cardStatus &&
          (giftCard.cardStatus != 'active' &&
            giftCard.cardStatus != 'inactive' &&
            giftCard.cardStatus != 'expired')
        ) {
          giftCard = giftCard || {};
          giftCard['status'] = 'FAILURE';
        }

        var now = moment().unix() * 1000;

        var newData = giftCard;
        newData.invoiceId = dataSrc.invoiceId;
        newData.accessKey = dataSrc.accessKey;
        newData.invoiceUrl = dataSrc.invoiceUrl;
        newData.currency = dataSrc.currency;
        newData.amount = dataSrc.amount;
        newData.date = dataSrc.invoiceTime || now;
        newData.uuid = dataSrc.uuid;

        if (giftCard.status == 'PENDING' && count < 3) {
          this.logger.debug('Waiting for payment confirmation');
          this.mercadoLibreProvider.savePendingGiftCard(newData, null, () => {
            this.logger.debug(
              'Saving new gift card with status: ' + newData.status
            );
          });
          this.checkTransaction(count + 1, dataSrc);
          return;
        }

        this.mercadoLibreProvider.savePendingGiftCard(newData, null, () => {
          this.onGoingProcessProvider.clear();
          this.logger.debug(
            'Saved new gift card with status: ' + newData.status
          );
          this.mlGiftCard = newData;
          this.openFinishModal();
        });
      });
    },
    15000,
    {
      leading: true
    }
  );

  private initialize(wallet): void {
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
      .then(data => {
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
          .then(ctxp => {
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
          .catch(err => {
            this.onGoingProcessProvider.clear();
            this._resetValues();
            this.showError(err.title, err.message);
            return;
          });
      })
      .catch(err => {
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
    var title = this.translate.instant('Confirm');
    this.popupProvider.ionicConfirm(title, this.message).then(ok => {
      if (!ok) {
        if (this.isCordova) this.slideButton.isConfirmed(false);
        return;
      }

      this.publishAndSign(this.wallet, this.createdTx)
        .then(() => {
          this.onGoingProcessProvider.set('Comprando Vale-Presente');
          this.checkTransaction(1, this.createdTx.giftData);
        })
        .catch(err => {
          this._resetValues();
          this.showError(
            this.translate.instant('Could not send transaction'),
            this.bwcErrorProvider.msg(err)
          );
          return;
        });
    });
  }

  public onWalletSelect(wallet): void {
    this.wallet = wallet;
    this.initialize(wallet);
  }

  public showWallets(): void {
    this.isOpenSelector = true;
    let id = this.wallet ? this.wallet.credentials.walletId : null;
    const params = {
      wallets: this.wallets,
      selectedWalletId: id,
      title: 'Buy from'
    };
    const walletSelector = this.actionSheetProvider.createWalletSelector(
      params
    );
    walletSelector.present();
    walletSelector.onDidDismiss(wallet => {
      if (!_.isEmpty(wallet)) this.onWalletSelect(wallet);
      this.isOpenSelector = false;
    });
  }

  private openFinishModal(): void {
    let finishComment: string;
    let cssClass: string;
    if (this.mlGiftCard.status == 'FAILURE') {
      finishComment = 'Sua compra não pôde ser concluída';
      cssClass = 'danger';
    }
    if (this.mlGiftCard.status == 'PENDING') {
      finishComment = 'Sua compra foi adicionada à lista de pendentes';
      cssClass = 'warning';
    }
    if (
      this.mlGiftCard.status == 'SUCCESS' ||
      this.mlGiftCard.cardStatus == 'active'
    ) {
      finishComment = 'Vale-Presente gerado e pronto para usar';
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
        MercadoLibrePage,
        { invoiceId: this.invoiceId },
        { animate: false }
      );
    });
  }
}
