import { Component } from '@angular/core';
import { StatusBar } from '@ionic-native/status-bar';
import { TranslateService } from '@ngx-translate/core';
import {
  App,
  Events,
  ModalController,
  NavController,
  NavParams
} from 'ionic-angular';
import * as _ from 'lodash';
import { Logger } from '../../../../providers/logger/logger';

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
import { InvoiceProvider } from '../../../../providers/invoice/invoice';
import { KeyProvider } from '../../../../providers/key/key';
import { OnGoingProcessProvider } from '../../../../providers/on-going-process/on-going-process';
import { PayproProvider } from '../../../../providers/paypro/paypro';
import { PlatformProvider } from '../../../../providers/platform/platform';
import { PopupProvider } from '../../../../providers/popup/popup';
import { ProfileProvider } from '../../../../providers/profile/profile';
import { ReplaceParametersProvider } from '../../../../providers/replace-parameters/replace-parameters';
import { TxFormatProvider } from '../../../../providers/tx-format/tx-format';
import {
  Coin,
  TransactionProposal,
  WalletProvider
} from '../../../../providers/wallet/wallet';

// Pages
import { ConfirmPage } from '../../../send/confirm/confirm';

@Component({
  selector: 'confirm-invoice-page',
  templateUrl: 'confirm-invoice.html'
})
export class ConfirmInvoicePage extends ConfirmPage {
  public invoiceData: any;
  public invoiceName: string;
  public invoiceId: string;
  public invoiceUrl: string;
  public email: string;
  public onlyIntegers: boolean;
  public currency: string;
  public invoiceFeeSat: number;
  public coinAmount: number;
  public coinAmountSat: number;
  public merchantProvidedEmail?: string;
  public buyerProvidedEmail?: string;
  public currencyIsoCode: string;
  public amountUnitStr: string;
  public totalAmountStr: string;
  public invoiceFee: number;
  public networkFee: number;
  public totalAmount: number;
  public network: string;

  private message: string;
  private configWallet: any;
  private networkFeeSat: number;
  private parsedAmount: any;
  private browserUrl: string;
  private invoicePaid: boolean;
  constructor(
    app: App,
    actionSheetProvider: ActionSheetProvider,
    bwcErrorProvider: BwcErrorProvider,
    bwcProvider: BwcProvider,
    configProvider: ConfigProvider,
    decimalPipe: DecimalPipe,
    feeProvider: FeeProvider,
    private invoiceProvider: InvoiceProvider,
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
    public payproProvider: PayproProvider,
    platformProvider: PlatformProvider,
    walletTabsProvider: WalletTabsProvider,
    public clipboardProvider: ClipboardProvider,
    events: Events,
    appProvider: AppProvider,
    keyProvider: KeyProvider,
    statusBar: StatusBar
  ) {
    super(
      app,
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
      appProvider,
      keyProvider,
      statusBar
    );
    this.hideSlideButton = false;
    this.invoicePaid = false;
    this.usingMerchantFee = true;
    this.invoiceName = this.navParams.data.invoiceName;
    this.configWallet = this.configProvider.get().wallet;
  }

  async ngOnInit() {
    this.invoiceData = this.navParams.data.invoiceData;
    this.invoiceId = this.navParams.data.invoiceId;
    this.amount = this.invoiceData.price || 1;
    this.currency = this.invoiceData.currency || 'USD';
    this.onlyIntegers = this.invoiceData.currency === 'JPY';
    this.merchantProvidedEmail = this.navParams.data.email;
    let { emailAddress } = this.invoiceData.buyerProvidedInfo;
    this.buyerProvidedEmail = emailAddress;
    this.email = this.merchantProvidedEmail
      ? this.merchantProvidedEmail
      : this.buyerProvidedEmail
      ? this.buyerProvidedEmail
      : await this.getEmail();
    this.paymentTimeControl(this.invoiceData.expirationTime);
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: ConfirmInvoicePage');
  }

  ionViewWillEnter() {
    this.isOpenSelector = false;
    this.navCtrl.swipeBackEnabled = false;
    if (this.isCordova) {
      window.addEventListener('keyboardWillShow', () => {
        this.hideSlideButton = true;
      });

      window.addEventListener('keyboardWillHide', () => {
        this.hideSlideButton = false;
      });
    }
    const { BITPAY_API_URL } = this.invoiceProvider.credentials;
    this.browserUrl = `${BITPAY_API_URL}/invoice?id=${this.invoiceId}`;
    this.network = this.invoiceProvider.getNetwork();
    const walletsBtc = this.profileProvider.getWallets({
      onlyComplete: true,
      network: this.network,
      coin: 'btc',
      minAmount: this.invoiceData.paymentTotals['BTC']
    });
    const walletsBch = this.profileProvider.getWallets({
      onlyComplete: true,
      network: this.network,
      coin: 'bch',
      minAmount: this.invoiceData.paymentTotals['BCH']
    });
    this.wallets = [...walletsBtc, ...walletsBch];
    this.invoiceUrl = `${BITPAY_API_URL}/invoice/${this.invoiceId}`;
    const { selectedTransactionCurrency } = this.invoiceData.buyerProvidedInfo;
    if (selectedTransactionCurrency) {
      this.wallets = _.filter(this.wallets, (x: any) => {
        return x.credentials.coin == selectedTransactionCurrency.toLowerCase();
      });
    }
    if (_.isEmpty(this.wallets)) {
      this.openInBrowser('error');
      return;
    }
    this.onWalletSelect(this.wallets[0]);
  }

  public onWalletSelect(wallet): void {
    this.wallet = wallet;
    this.initialize(wallet).catch(() => {});
  }

  ionViewWillLeave() {
    if (!this.invoicePaid) {
      this.clipboardProvider.copy(this.invoiceUrl);
    } else {
      this.externalLinkProvider.open(this.browserUrl);
    }
  }

  public checkIfCoin() {
    return !!Coin[this.currency];
  }

  public openInBrowser(invoiceType) {
    this.clipboardProvider.copy(this.invoiceUrl);
    const msg = 'Open this invoice url in a browser to pay in another wallet.';
    const invoiceText = {
      redeemInstructions: msg
    };
    this.actionSheetProvider
      .createInfoSheet('copied-invoice-url', {
        cardConfig: invoiceText,
        error: invoiceType === 'error' ? 'No Wallets Available' : null,
        invoiceUrl: this.browserUrl
      })
      .present();
  }

  private async getEmail() {
    const email = await this.invoiceProvider.getUserEmail();
    if (email) {
      return Promise.resolve(email);
    } else {
      return Promise.resolve('');
    }
  }

  protected async initialize(wallet) {
    const COIN = wallet.coin.toUpperCase();
    this.parsedAmount = this.txFormatProvider.parseAmount(
      wallet.coin,
      this.invoiceData.price,
      this.invoiceData.currency
    );
    this.currencyIsoCode = this.parsedAmount.currency;
    this.amountUnitStr = this.parsedAmount.amountUnitStr;

    if (!this.isCryptoCurrencySupported(wallet, this.invoiceData)) {
      this.onGoingProcessProvider.clear();
      let msg = this.translate.instant(
        'Purchases with this cryptocurrency are not enabled'
      );
      this.showErrorInfoSheet(msg, null, true);
      return;
    }
    this.onGoingProcessProvider.set('loadingTxInfo');

    // Sometimes API does not return this element;
    this.invoiceData['minerFees'][COIN]['totalFee'] =
      this.invoiceData.minerFees[COIN].totalFee || 0;
    this.invoiceFeeSat = this.invoiceData.minerFees[COIN].totalFee;

    this.message = this.replaceParametersProvider.replace(
      this.translate.instant(
        `Payment request for BitPay invoice ${
          this.invoiceId
        } for {{amountUnitStr}} to merchant ${this.invoiceName}`
      ),
      { amountUnitStr: this.amountUnitStr }
    );
    this.onGoingProcessProvider.clear();

    this.networkFeeSat = this.invoiceData.minerFees[COIN].satoshisPerByte;
    this.coinAmountSat = this.invoiceData.paymentTotals[COIN];
    this.totalAmountStr = this.txFormatProvider.formatAmountStr(
      this.wallet.coin,
      this.coinAmountSat
    );
    this.coinAmount = this.txFormatProvider.formatAmount(this.coinAmountSat);
    this.checkFeeHigh(
      Number(this.parsedAmount.amountSat),
      Number(this.invoiceFeeSat) + Number(this.networkFeeSat)
    );
    this.setTotalAmount(
      this.wallet,
      this.parsedAmount.amountSat,
      this.invoiceFeeSat,
      this.networkFeeSat
    );
  }

  private checkFeeHigh(amount: number, fee: number) {
    if (this.isHighFee(amount, fee)) {
      this.showHighFeeSheet();
    }
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

  public isValidEmail() {
    return !!this.invoiceProvider.emailIsValid(this.email);
  }

  public async createTx(wallet, invoice, message: string) {
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

  public throwBuyerInfoError(err) {
    const title = this.translate.instant('Error');
    const msg = this.translate.instant(err.error);
    this.onGoingProcessProvider.clear();
    this.showErrorInfoSheet(msg, title, false);
    throw new Error(`${err.error}`);
  }

  public async buyConfirm() {
    const { selectedTransactionCurrency } = this.invoiceData.buyerProvidedInfo;

    if (!selectedTransactionCurrency) {
      await this.invoiceProvider
        .setBuyerProvidedCurrency(
          this.wallet.coin.toUpperCase(),
          this.invoiceId
        )
        .catch(err => {
          this.throwBuyerInfoError(err);
        });
    }

    if (!this.buyerProvidedEmail && !this.merchantProvidedEmail) {
      await this.invoiceProvider
        .setBuyerProvidedEmail(this.email, this.invoiceId)
        .catch(err => {
          this.throwBuyerInfoError(err);
        });
    }

    this.invoiceProvider.storeEmail(this.email);
    const ctxp = await this.createTx(
      this.wallet,
      this.invoiceData,
      this.message
    ).catch(err => {
      this.onGoingProcessProvider.clear();
      this.resetValues();
      throw this.showErrorInfoSheet(err.message, err.title);
    });

    if (!ctxp) {
      this.showErrorInfoSheet(
        this.translate.instant('Transaction has not been created')
      );
      return;
    }

    if (this.paymentExpired) {
      this.showErrorInfoSheet(
        this.translate.instant('This invoice payment request has expired.')
      );
      return undefined;
    }
    this.hideSlideButton = true;
    this.invoicePaid = true;
    return this.publishAndSign(ctxp, this.wallet).catch(async err =>
      this.handlePurchaseError(err)
    );
  }

  public async handlePurchaseError(err) {
    this.onGoingProcessProvider.clear();
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

  private resetValues() {
    this.totalAmountStr = this.invoiceFee = this.networkFee = this.totalAmount = this.wallet = null;
    this.tx = this.message = this.invoiceId = null;
  }

  public openPrivacyPolicy() {
    const url = 'https://bitpay.com/about/privacy';
    const optIn = true;
    const title = null;
    const message = this.translate.instant('View Privacy Policy');
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
}
