import { Component, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  App,
  Events,
  ModalController,
  NavController,
  NavParams
} from 'ionic-angular';
import * as _ from 'lodash';

// Pages
import { ChooseFeeLevelModal } from '../../choose-fee-level/choose-fee-level';
import { FinishModalPage } from '../../finish/finish';
import { CoinbaseAccountPage } from '../../integrations/coinbase/coinbase-account/coinbase-account';
import { ScanPage } from '../../scan/scan';
import { WalletDetailsPage } from '../../wallet-details/wallet-details';

// Providers
import { BitPayIdProvider, InvoiceProvider } from '../../../providers';
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { AddressBookProvider } from '../../../providers/address-book/address-book';
import { AddressProvider } from '../../../providers/address/address';
import { AnalyticsProvider } from '../../../providers/analytics/analytics';
import { AppProvider } from '../../../providers/app/app';
import { BwcErrorProvider } from '../../../providers/bwc-error/bwc-error';
import { BwcProvider } from '../../../providers/bwc/bwc';
import { ClipboardProvider } from '../../../providers/clipboard/clipboard';
import { CoinbaseProvider } from '../../../providers/coinbase/coinbase';
import { ConfigProvider } from '../../../providers/config/config';
import { CurrencyProvider } from '../../../providers/currency/currency';
import { ErrorsProvider } from '../../../providers/errors/errors';
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';
import { FeeProvider } from '../../../providers/fee/fee';
import { HomeIntegrationsProvider } from '../../../providers/home-integrations/home-integrations';
import { IABCardProvider } from '../../../providers/in-app-browser/card';
import { Logger } from '../../../providers/logger/logger';
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { PayproProvider } from '../../../providers/paypro/paypro';
import { PersistenceProvider } from '../../../providers/persistence/persistence';
import { PlatformProvider } from '../../../providers/platform/platform';
import { PopupProvider } from '../../../providers/popup/popup';
import { ProfileProvider } from '../../../providers/profile/profile';
import { RateProvider } from '../../../providers/rate/rate';
import { ReplaceParametersProvider } from '../../../providers/replace-parameters/replace-parameters';
import { TxConfirmNotificationProvider } from '../../../providers/tx-confirm-notification/tx-confirm-notification';
import { TxFormatProvider } from '../../../providers/tx-format/tx-format';
import { WalletConnectProvider } from '../../../providers/wallet-connect/wallet-connect';
import {
  TransactionProposal,
  WalletProvider
} from '../../../providers/wallet/wallet';

@Component({
  selector: 'page-confirm',
  templateUrl: 'confirm.html'
})
export class ConfirmPage {
  @ViewChild('slideButton')
  slideButton;
  protected bitcoreCash;

  public countDown = null;
  public CONFIRM_LIMIT_USD: number;
  protected FEE_TOO_HIGH_LIMIT_PER: number;

  public tx;
  public wallet;
  public wallets;
  public noWalletMessage: string;
  public criticalError: boolean;
  public showAddress: boolean;
  public walletSelectorTitle: string;
  public buttonText: string;
  public successText: string;
  public paymentExpired: boolean;
  public remainingTimeStr: string;
  public hideSlideButton: boolean;
  public amount: string;
  public showMultiplesOutputs: boolean;
  public fromMultiSend: boolean;
  public fromSelectInputs: boolean;
  public fromReplaceByFee: boolean;
  public recipients;
  public toAddressName;
  public coin: string;
  public isERCToken: boolean;
  public appName: string;
  public merchantFeeLabel: string;
  public totalAmountStr: string;
  public totalAmount;
  public pendingTxsNonce: number[];
  public showEnableRBF: boolean;
  public enableRBF: boolean = false;

  public showCustomizeNonce: boolean;

  // Config Related values
  public config;

  // Platform info
  public isCordova: boolean;

  // custom fee flag
  public usingCustomFee: boolean = false;
  public usingCustomNonce: boolean = false;
  public usingMerchantFee: boolean = false;

  public isOpenSelector: boolean;
  public fromWalletDetails: boolean;

  // Coinbase
  public fromCoinbase;
  public coinbaseAccount;
  public coinbaseAccounts;
  public showCoinbase;

  public mainTitle: string;
  public isSpeedUpTx: boolean;

  public requiredFee: number;
  public requiredFeeRate: number;
  public minAllowedGasLimit: number;
  public editGasPrice: boolean = false;
  public editGasLimit: boolean = false;
  public editNonce: boolean = false;
  public customGasPrice: number;
  public customGasLimit: number;
  public customNonce: number;
  public suggestedNonce: number;

  public merchantName: string;
  public itemizedDetails;

  public errors = this.bwcProvider.getErrors();

  // Wallet Connect
  public walletConnectRequestId: number;
  public walletConnectTokenInfo;
  public walletConnectPeerMeta;
  public walletConnectIsApproveRequest;

  // // Card flags for zen desk chat support
  // private isCardPurchase: boolean;
  // private isHelpOpen: boolean = false;

  constructor(
    protected addressProvider: AddressProvider,
    protected addressBookProvider: AddressBookProvider,
    protected analyticsProvider: AnalyticsProvider,
    protected app: App,
    protected actionSheetProvider: ActionSheetProvider,
    protected bwcErrorProvider: BwcErrorProvider,
    protected bwcProvider: BwcProvider,
    protected configProvider: ConfigProvider,
    protected currencyProvider: CurrencyProvider,
    protected errorsProvider: ErrorsProvider,
    protected externalLinkProvider: ExternalLinkProvider,
    protected feeProvider: FeeProvider,
    protected logger: Logger,
    protected modalCtrl: ModalController,
    protected navCtrl: NavController,
    protected navParams: NavParams,
    protected onGoingProcessProvider: OnGoingProcessProvider,
    protected platformProvider: PlatformProvider,
    protected profileProvider: ProfileProvider,
    protected popupProvider: PopupProvider,
    protected replaceParametersProvider: ReplaceParametersProvider,
    protected rateProvider: RateProvider,
    protected translate: TranslateService,
    protected txConfirmNotificationProvider: TxConfirmNotificationProvider,
    protected txFormatProvider: TxFormatProvider,
    protected walletProvider: WalletProvider,
    protected clipboardProvider: ClipboardProvider,
    protected events: Events,
    protected coinbaseProvider: CoinbaseProvider,
    protected appProvider: AppProvider,
    protected payproProvider: PayproProvider,
    private iabCardProvider: IABCardProvider,
    protected homeIntegrationsProvider: HomeIntegrationsProvider,
    protected persistenceProvider: PersistenceProvider,
    private walletConnectProvider: WalletConnectProvider,
    private invoiceProvider: InvoiceProvider,
    protected bitpayIdProvider: BitPayIdProvider
  ) {
    this.wallet = this.profileProvider.getWallet(this.navParams.data.walletId);
    this.fromWalletDetails = this.navParams.data.fromWalletDetails;
    this.fromCoinbase = this.navParams.data.fromCoinbase;
    this.bitcoreCash = this.bwcProvider.getBitcoreCash();
    this.CONFIRM_LIMIT_USD = 20;
    this.FEE_TOO_HIGH_LIMIT_PER = 15;
    this.config = this.configProvider.get();
    this.isCordova = this.platformProvider.isCordova;
    this.hideSlideButton = false;
    this.showMultiplesOutputs = false;
    this.recipients = this.navParams.data.recipients;
    this.fromMultiSend = this.navParams.data.fromMultiSend;
    this.fromSelectInputs = this.navParams.data.fromSelectInputs;
    this.fromReplaceByFee = this.navParams.data.fromReplaceByFee;
    this.appName = this.appProvider.info.nameCase;
    this.isSpeedUpTx = this.navParams.data.speedUpTx;
    this.showCoinbase =
      this.homeIntegrationsProvider.shouldShowInHome('coinbase') &&
      this.coinbaseProvider.isLinked() &&
      this.coinbaseProvider.isTokenValid();
    this.walletConnectRequestId = this.navParams.data.requestId;
    this.walletConnectTokenInfo = this.navParams.data.tokenInfo;
    this.walletConnectPeerMeta = this.navParams.data.peerMeta;
    this.walletConnectIsApproveRequest = this.navParams.data.isApproveRequest;
    // this.isCardPurchase =
    //   this.navParams.data.payProUrl &&
    //   this.navParams.data.payProUrl.includes('redir=wc');
    this.showCustomizeNonce =
      this.config.wallet.showCustomizeNonce && !this.navParams.data.paypro;
    this.showEnableRBF =
      this.config.wallet.showEnableRBF && !this.navParams.data.paypro;
  }

  ngOnInit() {
    // Overrides the ngOnInit logic of WalletTabsChild
  }

  // not ideal - workaround for navCtrl issues for wallet connect
  ionViewWillEnter() {
    this.events.publish('Update/ViewingWalletConnectConfirm', true);
  }

  ionViewWillLeave() {
    this.events.publish('Update/ViewingWalletConnectConfirm', false);
    this.navCtrl.swipeBackEnabled = true;
  }

  ngOnDestroy() {
    this.events.unsubscribe('Local/TagScan', this.updateDestinationTag);
  }

  private updateDestinationTag: any = data => {
    this.tx.destinationTag = data.value;
  };

  ionViewDidLoad() {
    this.getInvoiceData();
    this.logger.info('Loaded: ConfirmPage');
    this.navCtrl.swipeBackEnabled = false;
    this.isOpenSelector = false;
    this.coin = this.navParams.data.coin;
    let networkName;
    let amount;
    this.setTitle();
    if (this.fromMultiSend) {
      networkName = this.navParams.data.network;
      amount = this.navParams.data.totalAmount;
    } else if (this.fromSelectInputs || this.fromReplaceByFee) {
      networkName = this.navParams.data.network;
      amount = this.navParams.data.amount
        ? this.navParams.data.amount
        : this.navParams.data.totalInputsAmount;
    } else {
      amount = this.navParams.data.amount;
      try {
        networkName = this.addressProvider.getCoinAndNetwork(
          this.navParams.data.toAddress,
          this.navParams.data.network || ''
        ).network;
      } catch (e) {
        const message = this.replaceParametersProvider.replace(
          this.translate.instant(
            '{{appName}} only supports Bitcoin Cash using new version numbers addresses.'
          ),
          { appName: this.appName }
        );
        const backText = this.translate.instant('Go back');
        const learnText = this.translate.instant('Learn more');
        this.popupProvider
          .ionicConfirm(null, message, backText, learnText)
          .then(back => {
            if (!back) {
              const url =
                'https://support.bitpay.com/hc/en-us/articles/115004671663';
              this.externalLinkProvider.open(url);
            }
            this.navCtrl.pop();
          });
        return;
      }
    }

    this.tx = {
      toAddress: this.navParams.data.toAddress,
      description: this.navParams.data.description,
      destinationTag: this.navParams.data.destinationTag, // xrp
      paypro: this.navParams.data.paypro,
      data: this.navParams.data.data, // eth
      invoiceID: this.navParams.data.invoiceID, // xrp
      payProUrl: this.navParams.data.payProUrl,
      spendUnconfirmed: this.config.wallet.spendUnconfirmed,
      enableRBF: this.enableRBF,
      // Vanity tx info (not in the real tx)
      recipientType: this.navParams.data.recipientType,
      name: this.navParams.data.name,
      email: this.navParams.data.email,
      color: this.navParams.data.color,
      network: this.navParams.data.network
        ? this.navParams.data.network
        : networkName,
      coin: this.navParams.data.coin,
      txp: {},
      multisigContractAddress: this.navParams.data.multisigContractAddress,
      tokenAddress: this.navParams.data.tokenAddress,
      gasLimit: this.navParams.data.gasLimit,
      gasPrice: this.navParams.data.gasPrice,
      customData: this.navParams.data.customData,
      speedUpTx: this.isSpeedUpTx,
      fromSelectInputs: this.navParams.data.fromSelectInputs ? true : false,
      fromReplaceByFee: this.navParams.data.fromReplaceByFee ? true : false,
      inputs: this.navParams.data.inputs,
      nonce: this.navParams.data.nonce
    };

    this.isERCToken = this.currencyProvider.isERCToken(this.tx.coin);

    this.tx.sendMax = this.navParams.data.useSendMax ? true : false;

    this.tx.amount =
      this.navParams.data.useSendMax && this.shouldUseSendMax()
        ? 0
        : this.tx.coin == 'eth' || this.isERCToken
        ? Number(amount)
        : parseInt(amount, 10);

    this.tx.origToAddress = this.tx.toAddress;

    if (this.navParams.data.requiredFeeRate) {
      this.usingMerchantFee = true;
      this.tx.feeRate = this.requiredFeeRate = +this.navParams.data
        .requiredFeeRate;
    } else if (this.isSpeedUpTx) {
      this.usingCustomFee = true;
      this.tx.feeLevel =
        this.navParams.data.coin == 'eth' || this.isERCToken
          ? 'urgent'
          : 'custom';
    } else if (this.fromReplaceByFee) {
      this.usingCustomFee = true;
      this.tx.feeLevel = 'priority';
    } else {
      this.tx.feeLevel = this.feeProvider.getCoinCurrentFeeLevel(this.tx.coin);
    }

    if (this.tx.coin && this.tx.coin == 'bch' && !this.fromMultiSend) {
      this.tx.toAddress = this.bitcoreCash
        .Address(this.tx.toAddress)
        .toString(true);
    }
    this.setAddressesContactName();
    this.getAmountDetails();

    const feeOpts = this.feeProvider.getFeeOpts(this.tx.coin);
    this.tx.feeLevelName = feeOpts[this.tx.feeLevel];
    this.showAddress = false;
    this.walletSelectorTitle = this.translate.instant('Send from');

    this.setWalletSelector(this.tx.coin, this.tx.network)
      .then(() => {
        this.afterWalletSelectorSet();
      })
      .catch(err => {
        this.showErrorInfoSheet(err.msg, err.title, true);
      });

    if (this.isCordova) {
      window.addEventListener('keyboardWillShow', () => {
        this.hideSlideButton = true;
      });

      window.addEventListener('keyboardWillHide', () => {
        this.hideSlideButton = false;
      });
    }
    this.events.subscribe('Local/TagScan', this.updateDestinationTag);
  }

  private async getInvoiceData() {
    if (!this.navParams.data.payProUrl) return;
    const invoiceId = this.navParams.data.payProUrl.split('i/')[1];
    const network = this.navParams.data.payProUrl.includes('test')
      ? 'testnet'
      : 'livenet';
    const fetchData = await this.invoiceProvider.canGetInvoiceData(
      invoiceId,
      network
    );

    if (fetchData) {
      await this.getItemizedDetails(invoiceId);
      return;
    }

    const result = await this.bitpayIdProvider.unlockInvoice(invoiceId);

    if (result === 'unlockSuccess') {
      await this.getItemizedDetails(invoiceId);
    }
  }

  private async getItemizedDetails(invoiceId: string) {
    const invoiceData = await this.invoiceProvider.getBitPayInvoice(invoiceId);
    const { merchantName, itemizedDetails } = invoiceData;
    this.itemizedDetails = itemizedDetails;
    this.merchantName = merchantName;
  }

  private setTitle(): void {
    this.mainTitle = this.fromCoinbase
      ? this.translate.instant('Confirm Deposit')
      : this.isSpeedUpTx || this.fromReplaceByFee
      ? this.translate.instant('Confirm Speed Up')
      : this.walletConnectIsApproveRequest
      ? this.translate.instant('Spender Approval')
      : this.translate.instant('Confirm Payment');
  }

  private setAddressesContactName() {
    this.addressBookProvider.list(this.tx.network).then(contacts => {
      if (contacts && contacts.length > 0) {
        if (this.recipients) {
          _.each(this.recipients, r => {
            const existsContact = _.find(
              contacts,
              c => c.address === (r.addressToShow || r.toAddress || r.address)
            );
            if (existsContact) r.contactName = existsContact.name;
          });
        } else if (
          this.tx &&
          !this.tx.recipientType &&
          !this.tx.name &&
          !this.tx.paypro &&
          !this.fromCoinbase
        ) {
          const existsContact = _.find(
            contacts,
            c => c.address === this.tx.origToAddress
          );
          if (existsContact) this.toAddressName = existsContact.name;
        }
      }
    });
  }

  private getAmountDetails(): void {
    this.amount = this.txFormatProvider.formatAmount(this.coin, this.tx.amount);
  }

  private getTotalAmountDetails(tx, wallet) {
    if (wallet && wallet.credentials && !wallet.credentials.token) {
      if (tx.fromSelectInputs) {
        this.totalAmount = tx.amount;
        this.totalAmountStr = this.txFormatProvider.formatAmountStr(
          this.coin,
          tx.amount
        );
      } else {
        this.totalAmount = tx.amount + tx.txp[wallet.id].fee;
        this.totalAmountStr = this.txFormatProvider.formatAmountStr(
          this.coin,
          tx.amount + tx.txp[wallet.id].fee
        );
      }
    }
  }

  private shouldUseSendMax() {
    const chain = this.currencyProvider.getAvailableChains();
    return chain.includes(this.coin) && !this.tx.multisigContractAddress;
  }

  public getChain(coin: string): string {
    return this.currencyProvider.getChain(coin).toLowerCase();
  }

  private afterWalletSelectorSet() {
    if (
      this.wallet &&
      this.tx.coin === this.wallet.coin &&
      this.tx.network === this.wallet.network
    ) {
      this.setWallet(this.wallet);
    } else if (this.wallets.length > 1 || this.showCoinbase) {
      return this.showWallets();
    } else if (this.wallets.length) {
      this.setWallet(this.wallets[0]);
    }
  }

  private setWalletSelector(coin: string, network: string): Promise<any> {
    if (
      this.wallet &&
      this.wallet.network == network &&
      this.wallet.coin == coin
    ) {
      return Promise.resolve();
    }

    const opts = {
      onlyComplete: true,
      hasFunds: true,
      network,
      coin,
      noEthMultisig: this.tx.paypro ? true : false
    };

    this.wallets = this.profileProvider.getWallets(opts);

    this.coinbaseAccounts =
      this.showCoinbase && network === 'livenet'
        ? this.coinbaseProvider.getAvailableAccounts(coin)
        : [];

    if (_.isEmpty(this.wallets) && _.isEmpty(this.coinbaseAccounts)) {
      const msg = this.translate.instant(
        'You are trying to send more funds than you have available. Make sure you do not have funds locked by pending transaction proposals.'
      );
      const title = this.translate.instant('No wallets available');
      return Promise.reject({ msg, title });
    }
    return Promise.resolve();
  }

  /* sets a wallet on the UI, creates a TXPs for that wallet */

  private async setWallet(wallet) {
    this.wallet = wallet;
    this.coinbaseAccount = null;

    // If select another wallet
    this.tx.coin = this.wallet.coin;

    if (!this.usingCustomFee && !this.usingMerchantFee) {
      this.tx.feeLevel = this.feeProvider.getCoinCurrentFeeLevel(wallet.coin);
    }

    if (
      this.wallet.credentials.token &&
      this.wallet.credentials.token.address
    ) {
      this.tx.tokenAddress = this.wallet.credentials.token.address;
    }

    if (
      this.wallet.credentials.multisigEthInfo &&
      this.wallet.credentials.multisigEthInfo.multisigContractAddress
    ) {
      if (this.tx.paypro) {
        const msg = this.translate.instant(
          'Invoice payments are not available for ethereum multisig wallets'
        );
        setTimeout(() => {
          this.handleError(msg, true);
        }, 100);
        return;
      }
      this.tx.multisigContractAddress = this.wallet.credentials.multisigEthInfo.multisigContractAddress;
    }

    this.setButtonText(
      this.wallet.credentials.m > 1,
      !!this.tx.paypro,
      !!this.fromCoinbase,
      this.isSpeedUpTx,
      this.fromReplaceByFee
    );

    if (this.tx.paypro) {
      if (!this.currencyProvider.isUtxoCoin(this.tx.coin)) {
        // Update fees to most recent for eth ( in case required fee change ? )
        const address = await this.walletProvider.getAddress(
          this.wallet,
          false
        );
        const payload = {
          address
        };
        this.tx.paypro = await this.payproProvider.getPayProDetails({
          paymentUrl: this.tx.payProUrl,
          coin: this.wallet.coin,
          payload,
          disableLoader: true
        });
        this.tx.feeRate = parseInt(
          (this.tx.paypro.requiredFeeRate * 1.1).toFixed(0),
          10
        ); // Workaround to avoid gas price supplied is lower than requested error
      }
      this.paymentTimeControl(this.tx.paypro.expires);
    }
    const exit =
      this.wallet || (this.wallets && this.wallets.length === 1) ? true : false;
    const feeOpts = this.feeProvider.getFeeOpts(this.tx.coin);
    this.tx.feeLevelName = feeOpts[this.tx.feeLevel];
    this.updateTx(this.tx, this.wallet, { dryRun: true }).catch(err => {
      this.handleError(err, exit);
    });
  }

  private setCoinbaseAccount(option): void {
    this.wallet = null;
    this.coinbaseAccount = option.accountSelected;

    this.tx.coin = this.coinbaseAccount.currency.code.toLowerCase();

    this.setButtonText(
      false,
      !!this.tx.paypro,
      !!this.fromCoinbase,
      this.isSpeedUpTx,
      this.fromReplaceByFee
    );

    if (this.tx.paypro) {
      this.paymentTimeControl(this.tx.paypro.expires);
      this.tx.paypro.host = new URL(this.tx.payProUrl).host;
      this.tx.paypro.invoiceId = this.tx.payProUrl.replace(
        'https://bitpay.com/i/',
        ''
      );
      this.tx.minerFee = this.navParams.data.minerFee;
      this.totalAmount = this.tx.amount - this.tx.minerFee;
      this.totalAmountStr = this.txFormatProvider.formatAmountStr(
        this.coin,
        this.totalAmount
      );
    }
  }

  private showUseUnconfirmedMsg(): boolean {
    return (
      this.wallet.cachedStatus &&
      this.wallet.cachedStatus.balance.totalAmount >=
        this.tx.amount + this.tx.feeRate &&
      !this.tx.spendUnconfirmed
    );
  }

  private setButtonText(
    isMultisig: boolean,
    isPayPro: boolean,
    isCoinbase: boolean,
    isSpeedUp: boolean,
    isReplaceByFee: boolean
  ): void {
    if (isPayPro) {
      this.buttonText = this.isCordova
        ? this.translate.instant('Slide to pay')
        : this.translate.instant('Pay');
    } else if (isCoinbase) {
      this.buttonText = this.isCordova
        ? this.translate.instant('Slide to deposit')
        : this.translate.instant('Deposit');
      this.successText =
        this.wallet.credentials.n == 1
          ? this.translate.instant('Deposit success')
          : this.translate.instant('Deposit pending');
    } else if (isMultisig) {
      this.buttonText = this.isCordova
        ? this.translate.instant('Slide to accept')
        : this.translate.instant('Accept');
      this.successText =
        this.wallet.credentials.n == 1
          ? this.translate.instant('Payment Sent')
          : this.translate.instant('Proposal created');
      if (
        this.tx.multisigContractAddress &&
        (this.navParams.data.isEthMultisigConfirm ||
          this.navParams.data.isEthMultisigExecute)
      ) {
        this.successText = this.translate.instant('Proposal confirmed');
      }
    } else if (isSpeedUp || isReplaceByFee) {
      this.buttonText = this.isCordova
        ? this.translate.instant('Slide to speed up')
        : this.translate.instant('Speed up');
      this.successText = this.translate.instant('Speed up successful');
    } else if (this.walletConnectRequestId) {
      this.buttonText = this.isCordova
        ? this.translate.instant('Slide to approve and send')
        : this.translate.instant('Approve and send');
      this.successText = this.translate.instant('Transaction Sent');
    } else {
      this.buttonText = this.isCordova
        ? this.translate.instant('Slide to send')
        : this.translate.instant('Send');
      this.successText = this.translate.instant('Payment Sent');
    }
  }

  protected paymentTimeControl(expires: string): void {
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
    // if (this.isCardPurchase && m < 11 && !this.isHelpOpen) {
    //   this.isHelpOpen = true;
    //   this.iabCardProvider.show();
    //   this.iabCardProvider.sendMessage({ message: 'openZEChatStandalone' });
    // }

    this.remainingTimeStr = ('0' + m).slice(-2) + ':' + ('0' + s).slice(-2);
  }

  private updateTx(tx, wallet, opts): Promise<any> {
    return new Promise((resolve, reject) => {
      if (opts.clearCache) {
        tx.txp = {};
      }

      this.tx = tx;

      // End of quick refresh, before wallet is selected.
      if (!wallet) {
        return resolve();
      }

      this.onGoingProcessProvider.set('calculatingFee');
      this.feeProvider
        .getFeeRate(
          wallet.coin,
          tx.network,
          this.usingMerchantFee
            ? this.currencyProvider.getMaxMerchantFee(wallet.coin)
            : this.tx.feeLevel
        )
        .then(feeRate => {
          let msg;
          if (this.usingCustomFee) {
            msg = this.translate.instant('Custom');
            tx.feeLevelName = msg;
          }

          if (this.usingMerchantFee) {
            const maxAllowedFee = feeRate * 5;
            this.logger.info(
              `Using Merchant Fee: ${tx.feeRate} vs. referent level (5 * feeRate) ${maxAllowedFee}`
            );
            const isUtxo = this.currencyProvider.isUtxoCoin(wallet.coin);
            if (
              tx.network != 'testnet' &&
              tx.feeRate > maxAllowedFee &&
              isUtxo
            ) {
              this.onGoingProcessProvider.set('calculatingFee');
              this.showHighFeeSheet();
            }

            msg = this.translate.instant(
              'This payment requires a miner fee of:'
            );
            this.merchantFeeLabel = msg;
          } else {
            const feeOpts = this.feeProvider.getFeeOpts(wallet.coin);
            tx.feeLevelName = feeOpts[tx.feeLevel];
            if (feeRate) tx.feeRate = feeRate;
          }
          // call getSendMaxInfo if was selected from amount view
          if (tx.sendMax && this.shouldUseSendMax()) {
            this.useSendMax(tx, wallet, opts)
              .then(() => {
                return resolve();
              })
              .catch(err => {
                return reject(err);
              });
          } else if (tx.speedUpTx) {
            this.speedUpTx(tx, wallet, opts)
              .then(() => {
                return resolve();
              })
              .catch(err => {
                return reject(err);
              });
          } else {
            // txp already generated for this wallet?
            if (tx.txp[wallet.id]) {
              this.onGoingProcessProvider.clear();
              this.getTotalAmountDetails(tx, wallet);
              return resolve();
            }

            this.buildTxp(tx, wallet, opts)
              .then(() => {
                this.onGoingProcessProvider.clear();
                return resolve();
              })
              .catch(err => {
                this.onGoingProcessProvider.clear();
                return reject(err);
              });
          }
        })
        .catch(err => {
          this.logger.warn('Error getting fee rate', err);
          this.onGoingProcessProvider.clear();
          return reject(this.translate.instant('Error getting fee rate'));
        });
    });
  }

  private useSendMax(tx, wallet, opts) {
    return new Promise((resolve, reject) => {
      this.getSendMaxInfo(_.clone(tx), wallet)
        .then(sendMaxInfo => {
          if (sendMaxInfo) {
            this.logger.debug('Send max info', sendMaxInfo);

            if (sendMaxInfo.amount <= 0) {
              this.showErrorInfoSheet(
                this.translate.instant('Not enough funds for fee')
              );
              return resolve();
            }
            tx.sendMaxInfo = sendMaxInfo;
            tx.amount = tx.sendMaxInfo.amount;
            this.getAmountDetails();
          }
          this.showWarningSheet(wallet, sendMaxInfo);
          // txp already generated for this wallet?
          if (tx.txp[wallet.id]) {
            this.getTotalAmountDetails(tx, wallet);
            return resolve();
          }

          this.buildTxp(tx, wallet, opts)
            .then(() => {
              return resolve();
            })
            .catch(err => {
              return reject(err);
            });
        })
        .catch(() => {
          const msg = this.translate.instant(
            'Error getting SendMax information'
          );
          return reject(msg);
        });
    });
  }

  public speedUpTx(tx, wallet, opts) {
    return this.getSpeedUpTxInfo(_.clone(tx), wallet)
      .then(speedUpTxInfo => {
        if (speedUpTxInfo) {
          this.logger.debug('Speed Up info', speedUpTxInfo);

          if (wallet.coin === 'btc') {
            const feeRate = speedUpTxInfo.feeRate;
            tx.feeRate = feeRate.substr(0, feeRate.indexOf(' ')) * 1000;
          }

          tx.speedUpTxInfo = speedUpTxInfo;
        }
        if (wallet.coin === 'eth' || this.isERCToken) {
          tx.speedUpTxInfo.input = [];
          tx.amount = tx.speedUpTxInfo.amount;
          this.tx.amount = tx.amount;
          this.getAmountDetails();
          return this.buildTxp(tx, wallet, opts);
        } else {
          return this.feeProvider
            .getSpeedUpTxFee(wallet.network, speedUpTxInfo.size)
            .then(speedUpTxFee => {
              speedUpTxInfo.fee = speedUpTxFee;
              this.showWarningSheet(wallet, speedUpTxInfo);
              return this.getInput(wallet).then(input => {
                if (!input) {
                  const message = this.translate.instant(
                    'Transaction not found. Probably invalid.'
                  );
                  throw message;
                }
                tx.speedUpTxInfo.input = input;
                tx.amount = tx.speedUpTxInfo.input.satoshis - speedUpTxInfo.fee;
                if (tx.amount < 0) {
                  const message = this.translate.instant(
                    'Insufficient funds for paying speed up fee'
                  );
                  throw message;
                }
                this.tx.amount = tx.amount;
                this.getAmountDetails();
                return this.buildTxp(tx, wallet, opts);
              });
            })
            .catch(err => {
              const error = err
                ? err
                : this.translate.instant('Error getting Speed Up fee');
              return Promise.reject(error);
            });
        }
      })
      .catch(err => {
        const error = err
          ? err
          : this.translate.instant('Error getting Speed Up information');
        return Promise.reject(error);
      });
  }

  protected getFeeRate(amount: number, fee: number) {
    return (fee / (amount + fee)) * 100;
  }

  protected isHighFee(amount: number, fee: number) {
    if (this.walletConnectRequestId && this.walletConnectIsApproveRequest)
      return false; // avoid message for wallet connect approvals
    return this.getFeeRate(amount, fee) > this.FEE_TOO_HIGH_LIMIT_PER;
  }

  protected showHighFeeSheet() {
    const minerFeeWarning = this.actionSheetProvider.createMinerFeeWarningComponent();
    minerFeeWarning.present({ maxHeight: '100%', minHeight: '100%' });
  }

  protected showTotalAmountSheet() {
    const totalAmountFeeInfoSheet = this.actionSheetProvider.createInfoSheet(
      'total-amount'
    );
    totalAmountFeeInfoSheet.present();
  }

  protected showSubtotalAmountSheet() {
    const subtotalAmountFeeInfoSheet = this.actionSheetProvider.createInfoSheet(
      'subtotal-amount'
    );
    subtotalAmountFeeInfoSheet.present();
  }

  private buildTxp(tx, wallet, opts): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getTxp(_.clone(tx), wallet, opts.dryRun)
        .then(async txp => {
          if (this.isERCToken) {
            const chain = this.getChain(tx.coin);
            const fiatOfAmount = this.rateProvider.toFiat(
              tx.paypro ? tx.amount : txp.amount,
              this.config.wallet.settings.alternativeIsoCode,
              tx.coin
            );
            const fiatOfFee = this.rateProvider.toFiat(
              txp.fee,
              this.config.wallet.settings.alternativeIsoCode,
              chain
            );
            const per = this.getFeeRate(fiatOfAmount, fiatOfFee);
            txp.feeRatePerStr = per.toFixed(2) + '%';
            txp.feeTooHigh = this.isHighFee(
              tx.paypro ? tx.amount : txp.amount,
              txp.fee
            );
            this.totalAmountStr =
              (fiatOfAmount + fiatOfFee).toFixed(2) +
              ' ' +
              this.config.wallet.settings.alternativeIsoCode;
          } else {
            const per = this.getFeeRate(txp.amount, txp.fee);
            txp.feeRatePerStr = per.toFixed(2) + '%';
            txp.feeTooHigh = this.isHighFee(txp.amount, txp.fee);
          }

          tx.txp[wallet.id] = txp;
          this.tx = tx;

          if (wallet.coin == 'eth' || this.isERCToken) {
            this.customGasPrice = Number(
              (this.tx.txp[wallet.id].gasPrice * 1e-9).toFixed(2)
            );
            this.customGasLimit = this.tx.txp[wallet.id].gasLimit;
            if (!this.minAllowedGasLimit)
              this.minAllowedGasLimit = this.tx.txp[wallet.id].gasLimit;
            this.customNonce = this.tx.txp[wallet.id].nonce;
          }

          if (txp.feeTooHigh && txp.amount !== 0) {
            this.showHighFeeSheet();
          }

          this.logger.debug(
            'Confirm. TX Fully Updated for wallet:' +
              wallet.id +
              ' Txp:' +
              txp.id
          );

          this.getTotalAmountDetails(tx, wallet);

          return resolve();
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  private getSendMaxInfo(tx, wallet): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!tx.sendMax) return resolve();

      this.onGoingProcessProvider.set('retrievingInputs');
      this.walletProvider
        .getSendMaxInfo(wallet, {
          feePerKb: tx.feeRate,
          excludeUnconfirmedUtxos: !tx.spendUnconfirmed,
          returnInputs: true
        })
        .then(res => {
          this.onGoingProcessProvider.clear();
          return resolve(res);
        })
        .catch(err => {
          this.onGoingProcessProvider.clear();
          this.logger.warn('Error getting send max info', err);
          return reject(err);
        });
    });
  }

  private getSpeedUpTxInfo(tx, wallet): Promise<any> {
    if (!tx.speedUpTx) return Promise.resolve();

    this.onGoingProcessProvider.set('retrievingInputs');
    return this.walletProvider
      .getTx(wallet, this.navParams.data.txid)
      .then(res => {
        this.onGoingProcessProvider.clear();
        return Promise.resolve(res);
      })
      .catch(err => {
        this.onGoingProcessProvider.clear();
        this.logger.warn('Error getting speed up info', err);
        return Promise.reject(err);
      });
  }

  private showWarningSheet(wallet, info): void {
    if (!info) return;

    let msg, infoSheetType;

    if (this.tx.sendMax) {
      const warningMsg = this.verifyExcludedUtxos(wallet, info);
      msg = !_.isEmpty(warningMsg) ? warningMsg : '';
      infoSheetType = 'miner-fee-notice';
    } else {
      infoSheetType = 'speed-up-notice';
      msg = '';
    }

    const coinName = this.currencyProvider.getCoinName(wallet.coin);

    const { unitToSatoshi } = this.currencyProvider.getPrecision(this.tx.coin);

    const fee = info.fee / unitToSatoshi;

    const minerFeeNoticeInfoSheet = this.actionSheetProvider.createInfoSheet(
      infoSheetType,
      {
        coinName,
        fee,
        coin: this.tx.coin.toUpperCase(),
        msg
      }
    );
    minerFeeNoticeInfoSheet.present();
  }

  private verifyExcludedUtxos(_, sendMaxInfo) {
    const warningMsg = [];
    if (sendMaxInfo.utxosBelowFee > 0) {
      const amountBelowFeeStr =
        sendMaxInfo.amountBelowFee /
        this.currencyProvider.getPrecision(this.tx.coin).unitToSatoshi;
      const message = this.replaceParametersProvider.replace(
        this.translate.instant(
          'A total of {{amountBelowFeeStr}} {{coin}} were excluded. These funds come from UTXOs smaller than the network fee provided.'
        ),
        { amountBelowFeeStr, coin: this.tx.coin.toUpperCase() }
      );
      warningMsg.push(message);
    }

    if (sendMaxInfo.utxosAboveMaxSize > 0) {
      const amountAboveMaxSizeStr =
        sendMaxInfo.amountAboveMaxSize /
        this.currencyProvider.getPrecision(this.tx.coin).unitToSatoshi;
      const message = this.replaceParametersProvider.replace(
        this.translate.instant(
          'A total of {{amountAboveMaxSizeStr}} {{coin}} were excluded. The maximum size allowed for a transaction was exceeded.'
        ),
        { amountAboveMaxSizeStr, coin: this.tx.coin.toUpperCase() }
      );
      warningMsg.push(message);
    }
    return warningMsg.join('\n');
  }

  private getTxp(tx, wallet, dryRun: boolean): Promise<any> {
    return new Promise((resolve, reject) => {
      // ToDo: use a credential's (or fc's) function for this
      if (tx.description && !wallet.credentials.sharedEncryptingKey) {
        const msg = this.translate.instant(
          'Could not add message to imported wallet without shared encrypting key'
        );
        return reject(msg);
      }
      if (
        this.currencyProvider.isUtxoCoin(tx.coin) &&
        tx.amount > Number.MAX_SAFE_INTEGER
      ) {
        const msg = this.translate.instant('Amount too big');
        return reject(msg);
      }

      const txp: Partial<TransactionProposal> = {};
      // set opts.coin to wallet.coin
      txp.coin = wallet.coin;
      txp.chain = this.currencyProvider.getChain(txp.coin);
      txp.nonce = tx.nonce;

      if (this.fromMultiSend) {
        txp.outputs = [];
        this.navParams.data.recipients.forEach(recipient => {
          if (tx.coin && tx.coin == 'bch') {
            recipient.toAddress = this.bitcoreCash
              .Address(recipient.toAddress)
              .toString(true);

            recipient.addressToShow = this.walletProvider.getAddressView(
              tx.coin,
              tx.network,
              recipient.toAddress
            );
          }

          txp.outputs.push({
            toAddress: recipient.toAddress,
            amount: recipient.amount,
            message: tx.description,
            data: tx.data
          });
        });
      } else if (tx.paypro) {
        txp.outputs = [];
        const { instructions } = tx.paypro;
        for (const instruction of instructions) {
          txp.outputs.push({
            toAddress: instruction.toAddress,
            amount: instruction.amount,
            message: instruction.message,
            data: instruction.data,
            gasLimit: tx.gasLimit
          });
          if (this.walletProvider.isZceCompatible(this.wallet)) {
            txp.instantAcceptanceEscrow = instruction.instantAcceptanceEscrow;
          }
        }
      } else {
        if (tx.fromSelectInputs) {
          const size = this.walletProvider.getEstimatedTxSize(
            wallet,
            1,
            tx.inputs.length
          );
          let estimatedFee;
          switch (tx.coin) {
            case 'doge':
              estimatedFee = 1e8; // 1 DOGE
              break;
            default:
              estimatedFee =
                size * parseInt((tx.feeRate / 1000).toFixed(0), 10);
              break;
          }
          tx.fee = estimatedFee;
          tx.amount = tx.amount - estimatedFee;
        }

        txp.outputs = [
          {
            toAddress: tx.toAddress,
            amount: tx.amount,
            message: tx.description,
            data: tx.data,
            gasLimit: tx.gasLimit // wallet connect needs exact gasLimit value
          }
        ];
      }
      txp.excludeUnconfirmedUtxos = !tx.spendUnconfirmed;
      txp.dryRun = dryRun;

      if (tx.sendMaxInfo) {
        txp.inputs = tx.sendMaxInfo.inputs;
        txp.fee = tx.sendMaxInfo.fee;
      } else if (tx.speedUpTx && txp.coin === 'btc') {
        txp.inputs = [];
        txp.inputs.push(tx.speedUpTxInfo.input);
        txp.fee = tx.speedUpTxInfo.fee;
        txp.excludeUnconfirmedUtxos = true;
      } else if (tx.fromSelectInputs || tx.fromReplaceByFee) {
        txp.inputs = tx.inputs;
        txp.fee = tx.fee;
        if (tx.fromReplaceByFee) {
          txp.replaceTxByFee = true;
        }
      } else {
        if (this.usingCustomFee || this.usingMerchantFee) {
          txp.feePerKb = tx.feeRate;
        } else txp.feeLevel = tx.feeLevel;
      }

      txp.message = tx.description;

      if (tx.paypro) {
        txp.payProUrl = tx.payProUrl;
        tx.paypro.host = new URL(tx.payProUrl).host;
      }

      if (tx.customData) {
        txp.customData = tx.customData;
      } else if (tx.recipientType == 'wallet') {
        txp.customData = {
          toWalletName: tx.name ? tx.name : null
        };
      } else if (tx.recipientType == 'coinbase') {
        txp.customData = {
          service: 'coinbase'
        };
      } else if (this.walletConnectRequestId) {
        txp.customData = {
          service: 'walletConnect'
        };
      }

      if (tx.tokenAddress) {
        txp.tokenAddress = tx.tokenAddress;
        if (!tx.paypro) {
          for (const output of txp.outputs) {
            if (!output.data) {
              output.data = this.bwcProvider
                .getCore()
                .Transactions.get({ chain: 'ERC20' })
                .encodeData({
                  recipients: [
                    { address: output.toAddress, amount: output.amount }
                  ],
                  tokenAddress: tx.tokenAddress
                });
            }
          }
        }
      }

      if (
        tx.multisigContractAddress &&
        !this.navParams.data.isEthMultisigInstantiation &&
        !this.navParams.data.isEthMultisigConfirm &&
        !this.navParams.data.isEthMultisigExecute
      ) {
        txp.multisigContractAddress = tx.multisigContractAddress;
        for (const output of txp.outputs) {
          const data = output.data ? output.data : '0x';
          output.data = this.bwcProvider
            .getCore()
            .Transactions.get({ chain: 'ETHMULTISIG' })
            .submitEncodeData({
              recipients: [
                { address: output.toAddress, amount: output.amount }
              ],
              multisigContractAddress: tx.multisigContractAddress,
              data
            });
        }
      }

      if (
        tx.multisigContractAddress &&
        !this.navParams.data.isEthMultisigInstantiation &&
        this.navParams.data.isEthMultisigConfirm &&
        !this.navParams.data.isEthMultisigExecute
      ) {
        txp.multisigContractAddress = tx.multisigContractAddress;
        for (const output of txp.outputs) {
          if (!output.data) {
            output.data = this.bwcProvider
              .getCore()
              .Transactions.get({ chain: 'ETHMULTISIG' })
              .confirmTransactionEncodeData({
                multisigContractAddress: tx.multisigContractAddress,
                transactionId: +this.navParams.data.transactionId
              });
          }
        }
      }

      if (
        tx.multisigContractAddress &&
        !this.navParams.data.isEthMultisigInstantiation &&
        !this.navParams.data.isEthMultisigConfirm &&
        this.navParams.data.isEthMultisigExecute
      ) {
        txp.multisigContractAddress = tx.multisigContractAddress;
        for (const output of txp.outputs) {
          if (!output.data) {
            output.data = this.bwcProvider
              .getCore()
              .Transactions.get({ chain: 'ETHMULTISIG' })
              .executeTransactionEncodeData({
                multisigContractAddress: tx.multisigContractAddress,
                transactionId: +this.navParams.data.transactionId
              });
          }
        }
      }

      if (
        tx.multisigContractAddress &&
        this.navParams.data.isEthMultisigInstantiation &&
        !this.navParams.data.isEthMultisigConfirm &&
        !this.navParams.data.isEthMultisigExecute
      ) {
        txp.multisigContractAddress = tx.multisigContractAddress;
        for (const output of txp.outputs) {
          if (!output.data) {
            output.data = this.bwcProvider
              .getCore()
              .Transactions.get({ chain: 'ETHMULTISIG' })
              .instantiateEncodeData({
                addresses: this.navParams.data.multisigAddresses,
                requiredConfirmations: this.navParams.data
                  .requiredConfirmations,
                multisigGnosisContractAddress: tx.multisigContractAddress,
                dailyLimit: 0
              });
          }
        }
      }

      if (wallet.coin === 'xrp') {
        txp.invoiceID = tx.invoiceID;
        txp.destinationTag = tx.destinationTag;
      }

      if (wallet.coin === 'btc') txp.enableRBF = tx.enableRBF;

      this.walletProvider
        .getAddress(this.wallet, false)
        .then(address => {
          if (wallet.coin === 'xrp' && tx.toAddress === address) {
            const err = this.translate.instant(
              'Cannot send XRP to the same wallet you are trying to send from. Please check the destination address and try it again.'
            );
            return reject(err);
          }
          txp.from = address;
          this.setEthAddressNonce(this.wallet, txp).then(() => {
            this.walletProvider
              .createTx(wallet, txp)
              .then(ctxp => {
                return resolve(ctxp);
              })
              .catch(err => {
                return reject(err);
              });
          });
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  private async setEthAddressNonce(wallet, txp) {
    try {
      if (
        (txp.chain && txp.chain.toLowerCase() !== 'eth') ||
        this.isSpeedUpTx ||
        this.usingCustomNonce
      )
        return Promise.resolve();

      if (wallet.updatedNonce) {
        this.logger.debug('Using session nonce:', wallet.updatedNonce);
        txp.nonce = this.tx.nonce = wallet.updatedNonce + 1;
        return Promise.resolve();
      }

      // linked eth wallet could have two pendings txs from different tokens
      // this means we need to count pending txs from the linked wallet if is ERC20Token instead of the sending wallet
      let nonceWallet;
      if (this.currencyProvider.isERCToken(txp.coin)) {
        const linkedEthWallet = this.currencyProvider.getLinkedEthWallet(
          txp.coin,
          wallet.id,
          wallet.m
        );
        nonceWallet = this.profileProvider.getWallet(linkedEthWallet);
      } else nonceWallet = wallet;

      const setNonce = async () => {
        const nonce = await this.walletProvider.getNonce(
          nonceWallet,
          txp.chain ? txp.chain.toLowerCase() : txp.coin,
          txp.from
        );
        this.pendingTxsNonce = [];
        for (let tx of nonceWallet.completeHistory) {
          if (
            tx.confirmations === 0 &&
            (tx.action === 'sent' || tx.action === 'moved')
          ) {
            this.pendingTxsNonce.push(tx.nonce);
          } else break;
        }

        if (this.pendingTxsNonce.length > 0) {
          this.pendingTxsNonce.sort((a, b) => a - b);
          for (let i = 0; i < this.pendingTxsNonce.length; i++) {
            if (this.pendingTxsNonce[i] + 1 != this.pendingTxsNonce[i + 1]) {
              this.suggestedNonce = this.pendingTxsNonce[i] + 1;
              break;
            }
          }
        } else this.suggestedNonce = nonce;

        this.logger.debug(
          `Using web3 nonce: ${nonce} - Suggested Nonce: ${
            this.suggestedNonce
          } - pending txs: ${this.suggestedNonce - nonce}`
        );

        txp.nonce = this.tx.nonce = this.suggestedNonce;
      };

      const opts = {
        alsoUpdateHistory: true,
        force: true,
        walletId: this.wallet.id
      };
      return this.walletProvider
        .fetchTxHistory(nonceWallet, null, opts)
        .then(async txHistory => {
          nonceWallet.completeHistory = txHistory;
          await setNonce();
          return Promise.resolve();
        })
        .catch(async err => {
          if (err != 'HISTORY_IN_PROGRESS') {
            this.logger.warn('WalletHistoryUpdate ERROR', err);
            await setNonce();
            return Promise.resolve();
          }
        });
    } catch (error) {
      this.logger.warn('Could not get address nonce', error.message);
      return Promise.resolve();
    }
  }

  private instantiateMultisigContract: any = async (txp, n?: number) => {
    let tryNumber = n ? n : 0;

    var finishInstantiation = async () => {
      if (tryNumber < 6) {
        return this.instantiateMultisigContract(txp, ++tryNumber);
      } else {
        this.onGoingProcessProvider.clear();
        await this.showMultisigIntantiationInfoSheet();
        const pendingInstantiations =
          (await this.persistenceProvider.getEthMultisigPendingInstantiation(
            this.wallet.id
          )) || [];
        pendingInstantiations.push({
          walletId: this.wallet.credentials.id,
          sender: txp.from,
          txId: txp.txid,
          walletName: this.navParams.data.walletName,
          n: this.navParams.data.totalCopayers,
          m: this.navParams.data.requiredConfirmations
        });
        this.persistenceProvider.setEthMultisigPendingInstantiation(
          this.wallet.id,
          pendingInstantiations
        );
        this.openFinishModal(false, { redir: null });
      }
    };

    setTimeout(async () => {
      let multisigContractInstantiationInfo: any[] = [];

      const opts = {
        sender: txp.from,
        txId: txp.txid
      };
      multisigContractInstantiationInfo = await this.walletProvider.getMultisigContractInstantiationInfo(
        this.wallet,
        opts
      );
      if (multisigContractInstantiationInfo.length > 0) {
        const multisigContract = multisigContractInstantiationInfo.filter(
          multisigContract => {
            return multisigContract.transactionHash === txp.txid;
          }
        );

        if (!multisigContract[0]) finishInstantiation();

        const multisigEthInfo = {
          multisigContractAddress: multisigContract[0].instantiation,
          walletName: this.navParams.data.walletName,
          n: this.navParams.data.totalCopayers,
          m: this.navParams.data.requiredConfirmations
        };
        const pairedWallet = this.wallet;
        this.onGoingProcessProvider.clear();
        return this.createAndBindEthMultisigWallet(
          pairedWallet,
          multisigEthInfo
        );
      } else {
        finishInstantiation();
      }
    }, 10000);
  };

  private showMultisigIntantiationInfoSheet(): Promise<void> {
    return new Promise(resolve => {
      const insufficientFundsInfoSheet = this.actionSheetProvider.createInfoSheet(
        'multisig-instantiation'
      );
      insufficientFundsInfoSheet.present();
      insufficientFundsInfoSheet.onDidDismiss(_ => {
        return resolve();
      });
    });
  }

  public createAndBindEthMultisigWallet(pairedWallet, multisigEthInfo) {
    if (!_.isEmpty(pairedWallet)) {
      this.profileProvider
        .createMultisigEthWallet(pairedWallet, multisigEthInfo)
        .then(multisigWallet => {
          // store preferences for the paired eth wallet
          this.walletProvider.updateRemotePreferences(pairedWallet);
          this.openFinishModal(false, { redir: null }, multisigWallet.id).then(
            () => {
              this.events.publish('Local/WalletListChange');
            }
          );
        });
    }
  }

  private getInput(wallet): Promise<any> {
    return this.walletProvider.getUtxos(wallet).then(utxos => {
      let biggestUtxo = 0;
      let input;
      _.forEach(utxos, (u, i) => {
        if (u.txid === this.navParams.data.txid) {
          if (u.amount > biggestUtxo) {
            biggestUtxo = u.amount;
            input = utxos[i];
          }
        }
      });
      return input;
    });
  }

  private showInsufficientFundsInfoSheet(): void {
    this.logger.warn('ERROR: Insufficient funds for fee');

    const insufficientFundsInfoSheet = this.actionSheetProvider.createInfoSheet(
      'insufficient-funds'
    );
    insufficientFundsInfoSheet.present();
    insufficientFundsInfoSheet.onDidDismiss(option => {
      if (option || typeof option === 'undefined') {
        this.fromWalletDetails ? this.navCtrl.pop() : this.navCtrl.popToRoot();
      } else {
        this.tx.sendMax = true;
        this.setWallet(this.wallet);
      }
    });
  }

  private showInsufficientFundsForFeeInfoSheet(
    fee,
    feeAlternative,
    feeLevel,
    coin,
    exit
  ): void {
    this.logger.warn(
      `ERROR: Insufficient funds for fee. Required fee: ${fee}. Fee Alternative: ${feeAlternative}. Fee level: ${feeLevel}. Coin: ${coin}`
    );

    const canChooseFeeLevel =
      coin !== 'bch' &&
      coin !== 'xrp' &&
      coin !== 'doge' &&
      coin !== 'ltc' &&
      !this.usingMerchantFee &&
      !this.fromCoinbase &&
      !this.tx.payProUrl &&
      feeLevel !== 'superEconomy';

    const insufficientFundsInfoSheet = this.actionSheetProvider.createInfoSheet(
      'insufficient-funds-for-fee',
      {
        fee,
        feeAlternative,
        coin,
        isERCToken: this.isERCToken,
        canChooseFeeLevel
      }
    );
    insufficientFundsInfoSheet.present();
    insufficientFundsInfoSheet.onDidDismiss(option => {
      if (option) {
        this.openExternalLink(
          'https://support.bitpay.com/hc/en-us/articles/115003393863-What-are-bitcoin-miner-fees-'
        );
      } else if (canChooseFeeLevel) {
        this.chooseFeeLevel();
        return;
      }
      if (exit) {
        this.fromWalletDetails ? this.navCtrl.pop() : this.navCtrl.popToRoot();
      }
    });
  }

  public showErrorInfoSheet(
    error: Error | string,
    title?: string,
    exit?: boolean
  ): void {
    let msg: string;
    if (!error) return;
    this.logger.warn('ERROR:', error);
    if (this.isCordova) this.slideButton.isConfirmed(false);

    if (
      (error as Error).message === 'FINGERPRINT_CANCELLED' ||
      (error as Error).message === 'PASSWORD_CANCELLED'
    ) {
      return;
    }

    if ((error as Error).message === 'WRONG_PASSWORD') {
      this.errorsProvider.showWrongEncryptPasswordError();
      return;
    }

    // Currently the paypro error is the following string: 500 - "{}"
    if (error.toString().includes('500 - "{}"')) {
      msg = this.tx.paypro
        ? this.translate.instant(
            'There is a temporary problem with the merchant requesting the payment. Please try later'
          )
        : this.translate.instant(
            'Error 500 - There is a temporary problem, please try again later.'
          );
    }

    const infoSheetTitle = title ? title : this.translate.instant('Error');

    this.errorsProvider.showDefaultError(
      msg || this.bwcErrorProvider.msg(error),
      infoSheetTitle,
      () => {
        if (exit) {
          this.fromWalletDetails
            ? this.navCtrl.pop()
            : this.navCtrl.popToRoot();
        }
      }
    );
  }

  public toggleAddress(): void {
    this.showAddress = !this.showAddress;
  }

  public onWalletSelect(option): void {
    if (option.isCoinbaseAccount) this.setCoinbaseAccount(option);
    else this.setWallet(option);
  }

  public approve(tx, wallet): Promise<void> {
    if (!tx || (!wallet && !this.coinbaseAccount)) return undefined;

    if (this.paymentExpired) {
      this.showErrorInfoSheet(
        this.translate.instant('This bitcoin payment request has expired.')
      );
      return undefined;
    }

    if (wallet) {
      this.onGoingProcessProvider.set('creatingTx');
      return this.getTxp(_.clone(tx), wallet, false)
        .then(txp => {
          this.logger.debug('Transaction Fee:', txp.fee);
          return this.confirmTx(txp, wallet).then((nok: boolean) => {
            if (nok) {
              if (this.isCordova) this.slideButton.isConfirmed(false);
              this.onGoingProcessProvider.clear();
              return;
            }
            this.publishAndSign(txp, wallet);
          });
        })
        .catch(err => {
          this.onGoingProcessProvider.clear();
          this.logger.warn('Error getting transaction proposal', err);
        });
    } else {
      return this.payWithCoinbaseAccount(
        this.tx.paypro.invoiceId,
        this.coinbaseAccount.currency.code
      );
    }
  }

  private confirmTx(txp, wallet) {
    return new Promise<boolean>(resolve => {
      if (wallet.isPrivKeyEncrypted) return resolve(false);
      this.txFormatProvider.formatToUSD(wallet.coin, txp.amount).then(val => {
        const amountUsd = parseFloat(val);
        if (amountUsd <= this.CONFIRM_LIMIT_USD) return resolve(false);
        const unit = txp.coin.toUpperCase();
        const amount = (
          this.tx.amount /
          this.currencyProvider.getPrecision(txp.coin).unitToSatoshi
        ).toFixed(8);
        const name = wallet.name;
        const message = this.replaceParametersProvider.replace(
          this.translate.instant(
            'Sending {{amount}} {{unit}} from your {{name}} wallet'
          ),
          { amount, unit, name }
        );
        const okText = this.translate.instant('Confirm');
        const cancelText = this.translate.instant('Cancel');
        this.popupProvider
          .ionicConfirm(null, message, okText, cancelText)
          .then((ok: boolean) => {
            return resolve(!ok);
          });
      });
    });
  }

  protected publishAndSign(txp, wallet) {
    if (!wallet.canSign) {
      return this.onlyPublish(txp, wallet);
    }

    return this.walletProvider
      .publishAndSign(wallet, txp)
      .then(txp => {
        if (
          this.config.confirmedTxsNotifications &&
          this.config.confirmedTxsNotifications.enabled
        ) {
          this.txConfirmNotificationProvider.subscribe(wallet, {
            txid: txp.txid,
            amount: txp.amount
          });
        }
        let redir;

        if (txp.payProUrl && txp.payProUrl.includes('redir=wc')) {
          redir = 'wc';
        }

        // update eth wallet nonce
        if (
          txp.chain &&
          txp.chain.toLowerCase() == 'eth' &&
          !this.isSpeedUpTx &&
          !this.usingCustomNonce
        ) {
          this.profileProvider.updateEthWalletNonce(
            wallet.credentials.walletId,
            txp.nonce
          );
        }

        if (this.navParams.data.isEthMultisigInstantiation) {
          this.onGoingProcessProvider.set('creatingEthMultisigWallet');
          return this.instantiateMultisigContract(txp);
        } else if (this.walletConnectRequestId) {
          this.walletConnectProvider.approveRequest(
            this.walletConnectRequestId,
            txp.txid
          );
          this.onGoingProcessProvider.clear();
          return this.openFinishModal(false, { redir }, null, false);
        } else {
          this.onGoingProcessProvider.clear();
          return this.openFinishModal(false, { redir });
        }
      })
      .catch(err => {
        if (this.isCordova) this.slideButton.isConfirmed(false);
        this.onGoingProcessProvider.clear();
        this.showErrorInfoSheet(err);
        this.logger.warn('Error on publishAndSign: removing payment proposal');
        this.walletProvider.removeTx(wallet, txp).catch(() => {
          this.logger.warn('Could not delete payment proposal');
        });
        if (typeof err == 'string' && err.includes('Broadcasting timeout')) {
          this.navigateBack(
            txp.payProUrl && txp.payProUrl.includes('redir=wc') ? 'wc' : null
          );
        }
      });
  }

  private onlyPublish(txp, wallet): Promise<void> {
    this.logger.info('No signing proposal: No private key');
    this.onGoingProcessProvider.set('sendingTx');
    return this.walletProvider
      .onlyPublish(wallet, txp)
      .then(() => {
        this.onGoingProcessProvider.clear();
        this.openFinishModal(true);
      })
      .catch(err => {
        this.onGoingProcessProvider.clear();
        this.showErrorInfoSheet(err);
      });
  }

  protected async openFinishModal(
    onlyPublish?: boolean,
    redirectionParam?: { redir: string },
    walletId?: string,
    navigateBack: boolean = true
  ) {
    const { redir } = redirectionParam || { redir: '' };

    let params: {
      finishText: string;
      finishComment?: string;
      autoDismiss?: boolean;
    } = {
      finishText: this.successText,
      autoDismiss: !!redir
    };
    if (onlyPublish) {
      const finishText = this.translate.instant('Payment Published');
      const finishComment = this.translate.instant(
        'You could sign the transaction later in your wallet details'
      );
      params = { finishText, finishComment };
    }
    const modal = this.modalCtrl.create(FinishModalPage, params, {
      showBackdrop: true,
      enableBackdropDismiss: false,
      cssClass: 'finish-modal'
    });
    await modal.present();

    this.clipboardProvider.clearClipboardIfValidData([
      'PayPro',
      'BitcoinUri',
      'BitcoinCashUri',
      'EthereumUri',
      'DogecoinUri',
      'LitecoinUri',
      'RippleUri',
      'InvoiceUri'
    ]);

    if (navigateBack) {
      this.navigateBack(redir, walletId);
    }
  }

  private navigateBack(redir?: string, walletId?: string) {
    this.navCtrl.popToRoot().then(_ => {
      if (this.fromCoinbase) {
        this.coinbaseProvider.logEvent({
          method: 'deposit',
          amount: this.amount,
          currency: this.coin
        });
        this.navCtrl.push(CoinbaseAccountPage, {
          id: this.fromCoinbase.accountId
        });
      } else {
        if (redir) {
          setTimeout(() => {
            this.iabCardProvider.show();
            this.iabCardProvider.sendMessage(
              {
                message: 'paymentBroadcasted'
              },
              () => {
                this.logger.log('card IAB -> payment broadcasting opening IAB');
              }
            );
          }, 1000);
        } else if (this.wallet) {
          this.navCtrl.push(WalletDetailsPage, {
            walletId: walletId ? walletId : this.wallet.credentials.walletId
          });
        }
      }
    });
  }

  public chooseFeeLevel(): void {
    if (
      this.tx.coin === 'bch' ||
      this.tx.coin === 'xrp' ||
      this.tx.coin === 'doge' ||
      this.tx.coin === 'ltc' ||
      this.tx.payProUrl ||
      this.usingMerchantFee ||
      this.fromCoinbase
    )
      return;
    const txObject = {
      network: this.tx.network,
      coin: this.tx.coin,
      feeLevel: this.tx.feeLevel,
      customFeePerKB: this.usingCustomFee ? this.tx.feeRate : undefined,
      feePerSatByte: this.usingCustomFee ? this.tx.feeRate / 1000 : undefined,
      isSpeedUpTx: this.isSpeedUpTx
    };

    const chooseFeeLevelModal = this.modalCtrl.create(
      ChooseFeeLevelModal,
      txObject
    );
    chooseFeeLevelModal.present();
    chooseFeeLevelModal.onDidDismiss(data => {
      data && data.showMinWarning
        ? this.showCustomFeeWarningSheet(data)
        : this.onFeeModalDismiss(data);
    });
  }

  private onFeeModalDismiss(data) {
    if (_.isEmpty(data)) return;

    this.logger.debug(
      'New fee level chosen:' + data.newFeeLevel + ' was:' + this.tx.feeLevel
    );
    this.usingCustomFee = data.newFeeLevel == 'custom' ? true : false;

    if (this.tx.feeLevel == data.newFeeLevel && !this.usingCustomFee) {
      return;
    }

    this.tx.feeLevel = data.newFeeLevel;
    const feeOpts = this.feeProvider.getFeeOpts(this.tx.coin);
    this.tx.feeLevelName = feeOpts[this.tx.feeLevel];
    if (this.usingCustomFee)
      this.tx.feeRate = parseInt(data.customFeePerKB, 10);

    this.updateTx(this.tx, this.wallet, {
      clearCache: true,
      dryRun: true
    }).catch(err => {
      this.handleError(err);
    });
  }

  private handleError(err, exit?) {
    const previousView = this.navCtrl.getPrevious().name;
    const isInsufficientFundsErr =
      err instanceof this.errors.INSUFFICIENT_FUNDS;
    const isInsufficientFundsForFeeErr =
      err instanceof this.errors.INSUFFICIENT_FUNDS_FOR_FEE;
    const isInsufficientLinkedEthFundsForFeeErr =
      err instanceof this.errors.INSUFFICIENT_ETH_FEE;

    if (
      this.tx.paypro &&
      this.tx.paypro.instructions &&
      this.tx.paypro.instructions[0] &&
      this.tx.paypro.instructions[0].instantAcceptanceEscrow
    ) {
      this.tx.paypro.instructions[0].instantAcceptanceEscrow = undefined;
      this.updateTx(this.tx, this.wallet, {
        clearCache: true,
        dryRun: true
      }).catch(err => this.handleError(err));
      return;
    }

    if (isInsufficientFundsErr) {
      if (this.showUseUnconfirmedMsg()) {
        this.showErrorInfoSheet(
          this.translate.instant(
            'You do not have enough confirmed funds to make this payment. Wait for your pending transactions to confirm or enable "Use unconfirmed funds" in Advanced Settings.'
          ),
          this.translate.instant('Not enough confirmed funds'),
          exit
        );
      } else if (previousView === 'AmountPage') {
        // Do not allow user to change or use max amount if previous view is not Amount
        this.showInsufficientFundsInfoSheet();
      } else {
        this.showErrorInfoSheet(
          this.translate.instant(
            'You are trying to send more funds than you have available. Make sure you do not have funds locked by pending transaction proposals.'
          ),
          this.translate.instant('Insufficient funds'),
          exit
        );
      }
    } else if (
      isInsufficientFundsForFeeErr ||
      isInsufficientLinkedEthFundsForFeeErr
    ) {
      let { requiredFee } = err.messageData;
      this.requiredFee = requiredFee;

      const coin = this.tx.coin.toLowerCase();
      const feeLevel = this.tx.feeLevel;
      let feeCoin = isInsufficientLinkedEthFundsForFeeErr ? 'eth' : coin;

      const feeAlternative = this.txFormatProvider.formatAlternativeStr(
        feeCoin,
        requiredFee
      );
      const fee = this.txFormatProvider.formatAmountStr(feeCoin, requiredFee);
      this.showInsufficientFundsForFeeInfoSheet(
        fee,
        feeAlternative,
        feeLevel,
        coin,
        exit
      );
    } else {
      this.showErrorInfoSheet(err, null, exit);
    }
  }

  public showWallets(): void {
    if (this.fromSelectInputs || this.fromReplaceByFee) return;
    this.isOpenSelector = true;
    const id = this.wallet ? this.wallet.credentials.walletId : null;

    let coinbaseData = { user: [], availableAccounts: [] };
    if (this.showCoinbase) {
      coinbaseData = {
        user: this.coinbaseProvider.coinbaseData.user,
        availableAccounts: this.coinbaseAccounts
      };
    }

    const params = {
      wallets: this.wallets,
      selectedWalletId: id,
      title: this.walletSelectorTitle,
      coinbaseData
    };
    const walletSelector = this.actionSheetProvider.createWalletSelector(
      params
    );
    walletSelector.present();
    walletSelector.onDidDismiss(option => {
      this.onSelectWalletEvent(option);
    });
  }

  private onSelectWalletEvent(option): void {
    if (!_.isEmpty(option)) this.onWalletSelect(option);
    this.isOpenSelector = false;
  }

  public close() {
    this.navCtrl.popToRoot();
  }

  public editMemo(memo: string) {
    const memoComponent = this.actionSheetProvider.createMemoComponent(memo);
    memoComponent.present();
    memoComponent.onDidDismiss(memo => {
      if (memo) this.tx.description = memo;
    });
  }

  public enableRBFChange() {
    this.tx.enableRBF = this.enableRBF;
  }

  public openScanner(): void {
    this.navCtrl.push(ScanPage, { fromConfirm: true });
  }

  protected payWithCoinbaseAccount(invoiceId, coin, code?): Promise<void> {
    this.onGoingProcessProvider.set('payingWithCoinbase');
    return this.coinbaseProvider
      .payInvoice(invoiceId, coin, code)
      .then(() => {
        this.onGoingProcessProvider.clear();
        this.openFinishModal();
      })
      .catch(err => {
        this.onGoingProcessProvider.clear();
        if (err == '2fa') {
          const message = this.translate.instant('Enter 2-step verification');
          const opts = {
            type: 'number',
            enableBackdropDismiss: false
          };
          this.popupProvider.ionicPrompt(null, message, opts).then(res => {
            if (res === null) {
              this.showErrorAndBack(
                this.translate.instant('Missing 2-step verification')
              );
              return;
            }
            this.payWithCoinbaseAccount(invoiceId, coin, res);
          });
        } else {
          this.showErrorAndBack(err);
        }
      });
  }

  protected showErrorAndBack(err): void {
    if (this.isCordova) this.slideButton.isConfirmed(false);
    this.logger.error(err);
    err = err.errors ? err.errors[0].message : err;
    this.popupProvider.ionicAlert(this.translate.instant('Error'), err);
  }

  private showCustomFeeWarningSheet(data) {
    const warningSheet = this.actionSheetProvider.createInfoSheet(
      'custom-fee-warning'
    );
    warningSheet.present();
    warningSheet.onDidDismiss(option => {
      option ? this.chooseFeeLevel() : this.onFeeModalDismiss(data);
    });
  }

  public openExternalLink(url: string) {
    this.externalLinkProvider.open(url);
  }

  public setGasPrice(): void {
    this.editGasPrice = !this.editGasPrice;

    const data = {
      newFeeLevel: 'custom',
      customFeePerKB: this.customGasPrice * 1e9
    };
    this.logger.debug('Setting custom gas price: ', this.customGasPrice * 1e9);

    this.onFeeModalDismiss(data);
  }

  public setGasLimit(): void {
    this.editGasLimit = !this.editGasLimit;
    this.tx.gasLimit = this.tx.txp[
      this.wallet.id
    ].gasLimit = this.customGasLimit;

    const data = {
      newFeeLevel: 'custom',
      customFeePerKB: this.tx.txp[this.wallet.id].gasPrice
    };
    this.logger.debug('Setting custom gas limit: ', this.tx.gasLimit);
    this.onFeeModalDismiss(data);
  }

  public setCustomizeNonce(): void {
    this.editNonce = !this.editNonce;
    this.tx.nonce = this.tx.txp[this.wallet.id].nonce = Number(
      this.customNonce
    );
    this.usingCustomNonce = true;
    this.logger.debug('Setting custom nonce: ', this.tx.nonce);
    this.updateTx(this.tx, this.wallet, {
      clearCache: true,
      dryRun: true
    }).catch(err => {
      this.handleError(err);
    });
  }

  public setDefaultImgSrc(img) {
    img.onerror = null;
    img.src = 'assets/img/wallet-connect/icon-dapp.svg';
  }

  public rejectRequest(): void {
    this.walletConnectProvider
      .rejectRequest(this.walletConnectRequestId)
      .then(_ => {
        this.navCtrl.pop();
      });
  }
}
