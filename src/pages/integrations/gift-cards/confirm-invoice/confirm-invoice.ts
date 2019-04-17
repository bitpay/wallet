import { Component } from '@angular/core';
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

// Pages
import { FinishModalPage } from '../../../finish/finish';

// Provider
import { DecimalPipe } from '@angular/common';
import {
  FeeProvider,
  TxConfirmNotificationProvider,
  WalletTabsProvider
} from '../../../../providers';
import { ActionSheetProvider } from '../../../../providers/action-sheet/action-sheet';
import { AppProvider } from '../../../../providers/app/app';
import { BwcErrorProvider } from '../../../../providers/bwc-error/bwc-error';
import { BwcProvider } from '../../../../providers/bwc/bwc';
import { ClipboardProvider } from '../../../../providers/clipboard/clipboard';
import { ConfigProvider } from '../../../../providers/config/config';
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { GiftCardProvider } from '../../../../providers/gift-card/gift-card';
import { CardConfig } from '../../../../providers/gift-card/gift-card.types';
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
import { ConfirmPage } from '../../../send/confirm/confirm';
import { CardDetailsPage } from '../card-details/card-details';

@Component({
  selector: 'confirm-invoice-page',
  templateUrl: 'confirm-invoice.html'
})
export class ConfirmInvoicePage extends ConfirmPage {
  private message: string;
  private invoiceId: string;
  private configWallet;
  public currencyIsoCode: string;

  public totalAmountStr: string;
  public invoiceFee: number;
  public networkFee: number;
  public totalAmount: number;
  public amountUnitStr: string;
  public network: string;
  public onlyIntegers: boolean;
  public amount: number;

  public cardConfig: CardConfig;
  public hideSlideButton: boolean;

  constructor(
    actionSheetProvider: ActionSheetProvider,
    bwcErrorProvider: BwcErrorProvider,
    bwcProvider: BwcProvider,
    configProvider: ConfigProvider,
    decimalPipe: DecimalPipe,
    feeProvider: FeeProvider,
    private giftCardProvider: GiftCardProvider,
    replaceParametersProvider: ReplaceParametersProvider,
    externalLinkProvider: ExternalLinkProvider,
    logger: Logger,
    modalCtrl: ModalController,
    navCtrl: NavController,
    navParams: NavParams,
    onGoingProcessProvider: OnGoingProcessProvider,
    popupProvider: PopupProvider,
    profileProvider: ProfileProvider,
    txConfirmNotificationProvider: TxConfirmNotificationProvider,
    txFormatProvider: TxFormatProvider,
    walletProvider: WalletProvider,
    translate: TranslateService,
    private payproProvider: PayproProvider,
    platformProvider: PlatformProvider,
    walletTabsProvider: WalletTabsProvider,
    clipboardProvider: ClipboardProvider,
    events: Events,
    AppProvider: AppProvider
  ) {
    super(
      actionSheetProvider,
      bwcErrorProvider,
      bwcProvider,
      configProvider,
      decimalPipe,
      externalLinkProvider,
      feeProvider,
      logger,
      modalCtrl,
      navCtrl,
      navParams,
      onGoingProcessProvider,
      platformProvider,
      profileProvider,
      popupProvider,
      replaceParametersProvider,
      translate,
      txConfirmNotificationProvider,
      txFormatProvider,
      walletProvider,
      walletTabsProvider,
      clipboardProvider,
      events,
      AppProvider
    );
    this.hideSlideButton = false;
    this.configWallet = this.configProvider.get().wallet;
  }

  ngOnInit() {
    this.invoiceId = this.navParams.data.invoiceId;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: ConfirmInvoicePage');
  }

  ionViewWillEnter() {
    this.isOpenSelector = false;
    this.navCtrl.swipeBackEnabled = false;

    this.network = this.giftCardProvider.getNetwork();
    this.wallets = this.profileProvider.getWallets({
      onlyComplete: true,
      network: this.network,
      hasFunds: true
    });
    // if (_.isEmpty(this.wallets)) {
    //   this.showErrorInfoSheet(
    //     this.translate.instant('No wallets available'),
    //     null,
    //     true
    //   );
    //   return;
    // }
    this.showWallets(); // Show wallet selector
  }

  public cancel() {
    this.navCtrl.popToRoot();
  }

  private checkFeeHigh(amount: number, fee: number) {
    if (this.isHighFee(amount, fee)) {
      this.showHighFeeSheet();
    }
  }

  public openExternalLink(url: string) {
    this.externalLinkProvider.open(url);
  }

  private resetValues() {
    this.totalAmountStr = this.invoiceFee = this.networkFee = this.totalAmount = this.wallet = null;
    this.tx = this.message = this.invoiceId = null;
  }

  async publishAndSign(wallet, txp) {
    if (!wallet.canSign() && !wallet.isPrivKeyExternal()) {
      const err = this.translate.instant('No signing proposal: No private key');
      return Promise.reject(err);
    }
    if (this.walletProvider.isEncrypted(wallet)) {
      this.hideSlideButton = true;
    }

    await this.walletProvider.publishAndSign(wallet, txp);
    this.hideSlideButton = false;
    return this.onGoingProcessProvider.clear();
  }

  private satToFiat(coin: string, sat: number) {
    return this.txFormatProvider.toFiat(coin, sat, this.currencyIsoCode);
  }

  private async setTotalAmount(
    wallet,
    amountSat: number,
    invoiceFeeSat: number,
    networkFeeSat: number
  ) {
    const amount = await this.satToFiat(wallet.coin, amountSat);
    this.amount = Number(amount);

    const invoiceFee = await this.satToFiat(wallet.coin, invoiceFeeSat);
    this.invoiceFee = Number(invoiceFee);

    const networkFee = await this.satToFiat(wallet.coin, networkFeeSat);
    this.networkFee = Number(networkFee);
    this.totalAmount = this.amount + this.invoiceFee + this.networkFee;
  }

  private isCryptoCurrencySupported(wallet, invoice) {
    const COIN = wallet.coin.toUpperCase();
    return (
      (invoice['supportedTransactionCurrencies'][COIN] &&
        invoice['supportedTransactionCurrencies'][COIN].enabled) ||
      false
    );
  }

  private async createTx(wallet, invoice, message: string) {
    const COIN = wallet.coin.toUpperCase();
    const payProUrl =
      invoice && invoice.paymentCodes ? invoice.paymentCodes[COIN].BIP73 : null;

    if (!payProUrl) {
      throw {
        title: this.translate.instant('Error in Payment Protocol'),
        message: this.translate.instant('Invalid URL')
      };
    }

    const details = await this.payproProvider
      .getPayProDetails(payProUrl, wallet.coin)
      .catch(err => {
        throw {
          title: this.translate.instant('Error in Payment Protocol'),
          message: err
        };
      });

    const txp: Partial<TransactionProposal> = {
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
      payProUrl,
      excludeUnconfirmedUtxos: this.configWallet.spendUnconfirmed ? false : true
    };

    if (details.requiredFeeRate) {
      txp.feePerKb = Math.ceil(details.requiredFeeRate * 1024);
      this.logger.debug('Using merchant fee rate:' + txp.feePerKb);
    } else {
      txp.feeLevel = this.configWallet.settings.feeLevel || 'normal';
    }

    txp['origToAddress'] = txp.toAddress;

    if (wallet.coin && wallet.coin == 'bch') {
      // Use legacy address
      txp.toAddress = this.bitcoreCash.Address(txp.toAddress).toString();
      txp.outputs[0].toAddress = txp.toAddress;
    }

    return this.walletProvider.createTx(wallet, txp).catch(err => {
      throw {
        title: this.translate.instant('Could not create transaction'),
        message: this.bwcErrorProvider.msg(err)
      };
    });
  }

  private async promptEmail(emailAddress?: string) {
    if (emailAddress) {
      this.giftCardProvider.storeEmail(emailAddress);
      return Promise.resolve(emailAddress);
    }
    const email = await this.giftCardProvider.getUserEmail();
    if (email) return Promise.resolve(email);
    const title = this.translate.instant('Enter email address');
    const message = this.translate.instant(
      'Where do you want to receive your purchase receipt?'
    );
    const opts = { type: 'email', defaultText: '' };
    const newEmail = await this.popupProvider.ionicPrompt(title, message, opts);
    if (!this.giftCardProvider.emailIsValid(newEmail)) {
      this.throwEmailRequiredError();
    }
    this.giftCardProvider.storeEmail(newEmail);
    return newEmail;
  }

  private throwEmailRequiredError() {
    const title = this.translate.instant('Error');
    const msg = this.translate.instant(
      'An email address is required for this purchase.'
    );
    this.onGoingProcessProvider.clear();
    this.showErrorInfoSheet(msg, title, true);
    throw new Error('email required');
  }

  private async initialize(wallet) {
    const data = await this.giftCardProvider
      .getBitPayInvoice(this.invoiceId)
      .catch(err => {
        this.onGoingProcessProvider.clear();
        throw this.showErrorInfoSheet(err.message, err.title, true);
      });

    this.amount = data.price;
    const COIN = wallet.coin.toUpperCase();
    const parsedAmount = this.txFormatProvider.parseAmount(
      wallet.coin,
      this.amount,
      data.currency
    );
    this.currencyIsoCode = parsedAmount.currency;
    this.amountUnitStr = parsedAmount.amountUnitStr;

    const { emailAddress } = data.buyerProvidedInfo;
    const email = await this.promptEmail(emailAddress);
    await this.giftCardProvider.setBuyerProvidedEmail(email, this.invoiceId);
    this.hideSlideButton = false;
    this.onGoingProcessProvider.set('loadingTxInfo');
    const invoice = data.invoice;

    if (!this.isCryptoCurrencySupported(wallet, invoice)) {
      this.onGoingProcessProvider.clear();
      let msg = this.translate.instant(
        'Purchases with this cryptocurrency are not enabled'
      );
      this.showErrorInfoSheet(msg, null, true);
      return;
    }

    // Sometimes API does not return this element;
    invoice['minerFees'][COIN]['totalFee'] =
      invoice.minerFees[COIN].totalFee || 0;
    let invoiceFeeSat = invoice.minerFees[COIN].totalFee;

    this.message = this.replaceParametersProvider.replace(
      this.translate.instant(`{{amountUnitStr}} Invoice`),
      { amountUnitStr: this.amountUnitStr }
    );

    const ctxp = await this.createTx(wallet, invoice, this.message).catch(
      err => {
        this.onGoingProcessProvider.clear();
        this.resetValues();
        throw this.showErrorInfoSheet(err.message, err.title);
      }
    );

    this.onGoingProcessProvider.clear();

    // Save in memory
    this.tx = ctxp;
    this.invoiceId = invoice.id;
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
  }

  public async buyConfirm() {
    if (!this.tx) {
      this.showErrorInfoSheet(
        this.translate.instant('Transaction has not been created')
      );
      return;
    }
    await this.giftCardProvider.setBuyerProvidedCurrency(
      this.wallet.coin.toUpperCase(),
      this.invoiceId
    );
    return this.publishAndSign(this.wallet, this.tx).catch(async err =>
      this.handlePurchaseError(err)
    );
  }

  public async handlePurchaseError(err) {
    this.onGoingProcessProvider.clear();
    await this.walletProvider.removeTx(this.wallet, this.tx);
    const errorMessage = err && err.message;
    const canceledErrors = ['FINGERPRINT_CANCELLED', 'PASSWORD_CANCELLED'];
    if (canceledErrors.indexOf(errorMessage) !== -1) {
      return;
    }
    if (['NO_PASSWORD', 'WRONG_PASSWORD'].indexOf(errorMessage) === -1) {
      this.resetValues();
    }
    this.showErrorInfoSheet(
      this.bwcErrorProvider.msg(err),
      this.translate.instant('Could not send transaction')
    );
  }

  public onWalletSelect(wallet): void {
    this.wallet = wallet;
    this.initialize(wallet).catch(() => {});
  }

  public showWallets(): void {
    this.isOpenSelector = true;
    let id = this.wallet ? this.wallet.credentials.walletId : null;
    const params = {
      wallets: this.wallets,
      selectedWalletId: id,
      title: this.translate.instant('Buy from')
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
}
