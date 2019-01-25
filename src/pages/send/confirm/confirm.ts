import { DecimalPipe } from '@angular/common';
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
import { Logger } from '../../../providers/logger/logger';

// Pages
import { FinishModalPage } from '../../finish/finish';
import { PayProPage } from '../../paypro/paypro';
import { TabsPage } from '../../tabs/tabs';
import { ChooseFeeLevelPage } from '../choose-fee-level/choose-fee-level';

// Providers
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { BwcErrorProvider } from '../../../providers/bwc-error/bwc-error';
import { BwcProvider } from '../../../providers/bwc/bwc';
import { ClipboardProvider } from '../../../providers/clipboard/clipboard';
import { ConfigProvider } from '../../../providers/config/config';
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';
import { FeeProvider } from '../../../providers/fee/fee';
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { PlatformProvider } from '../../../providers/platform/platform';
import { PopupProvider } from '../../../providers/popup/popup';
import { ProfileProvider } from '../../../providers/profile/profile';
import { ReplaceParametersProvider } from '../../../providers/replace-parameters/replace-parameters';
import { TxConfirmNotificationProvider } from '../../../providers/tx-confirm-notification/tx-confirm-notification';
import { TxFormatProvider } from '../../../providers/tx-format/tx-format';
import {
  Coin,
  TransactionProposal,
  WalletProvider
} from '../../../providers/wallet/wallet';
import { WalletTabsChild } from '../../wallet-tabs/wallet-tabs-child';
import { WalletTabsProvider } from '../../wallet-tabs/wallet-tabs.provider';

@Component({
  selector: 'page-confirm',
  templateUrl: 'confirm.html'
})
export class ConfirmPage extends WalletTabsChild {
  @ViewChild('slideButton')
  slideButton;

  private bitcore;
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
  public amount;
  public showMultiplesOutputs: boolean;
  public fromMultiSend: boolean;
  public recipients;
  public coin: string;

  // Config Related values
  public config;
  public configFeeLevel: string;

  // Platform info
  public isCordova: boolean;

  // custom fee flag
  public usingCustomFee: boolean = false;
  public usingMerchantFee: boolean = false;

  public isOpenSelector: boolean;

  constructor(
    protected actionSheetProvider: ActionSheetProvider,
    protected app: App,
    protected bwcErrorProvider: BwcErrorProvider,
    protected bwcProvider: BwcProvider,
    protected configProvider: ConfigProvider,
    protected decimalPipe: DecimalPipe,
    protected externalLinkProvider: ExternalLinkProvider,
    protected feeProvider: FeeProvider,
    protected logger: Logger,
    protected modalCtrl: ModalController,
    navCtrl: NavController,
    protected navParams: NavParams,
    protected onGoingProcessProvider: OnGoingProcessProvider,
    protected platformProvider: PlatformProvider,
    profileProvider: ProfileProvider,
    protected popupProvider: PopupProvider,
    protected replaceParametersProvider: ReplaceParametersProvider,
    protected translate: TranslateService,
    protected txConfirmNotificationProvider: TxConfirmNotificationProvider,
    protected txFormatProvider: TxFormatProvider,
    protected walletProvider: WalletProvider,
    walletTabsProvider: WalletTabsProvider,
    protected clipboardProvider: ClipboardProvider,
    protected events: Events
  ) {
    super(navCtrl, profileProvider, walletTabsProvider);
    this.bitcore = this.bwcProvider.getBitcore();
    this.bitcoreCash = this.bwcProvider.getBitcoreCash();
    this.CONFIRM_LIMIT_USD = 20;
    this.FEE_TOO_HIGH_LIMIT_PER = 15;
    this.config = this.configProvider.get();
    this.configFeeLevel = this.config.wallet.settings.feeLevel
      ? this.config.wallet.settings.feeLevel
      : 'normal';
    this.isCordova = this.platformProvider.isCordova;
    this.hideSlideButton = false;
    this.showMultiplesOutputs = false;
    this.recipients = this.navParams.data.recipients;
    this.fromMultiSend = this.navParams.data.fromMultiSend;
  }

  ngOnInit() {
    // Overrides the ngOnInit logic of WalletTabsChild
  }

  ionViewWillLeave() {
    this.navCtrl.swipeBackEnabled = true;
  }

  ionViewWillEnter() {
    this.navCtrl.swipeBackEnabled = false;
    this.isOpenSelector = false;
    const B =
      this.navParams.data.coin == 'bch' ? this.bitcoreCash : this.bitcore;
    let networkName;
    let amount;
    if (this.fromMultiSend) {
      networkName = this.navParams.data.network;
      amount = this.navParams.data.totalAmount;
      this.coin = this.navParams.data.coin;
    } else {
      amount = this.navParams.data.amount;
      try {
        networkName = new B.Address(this.navParams.data.toAddress).network.name;
      } catch (e) {
        const message = this.translate.instant(
          'Copay only supports Bitcoin Cash using new version numbers addresses'
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
      sendMax: this.navParams.data.useSendMax ? true : false,
      amount: this.navParams.data.useSendMax ? 0 : parseInt(amount, 10),
      description: this.navParams.data.description,
      paypro: this.navParams.data.paypro,
      spendUnconfirmed: this.config.wallet.spendUnconfirmed,

      // Vanity tx info (not in the real tx)
      recipientType: this.navParams.data.recipientType,
      name: this.navParams.data.name,
      email: this.navParams.data.email,
      color: this.navParams.data.color,
      network: this.navParams.data.network
        ? this.navParams.data.network
        : networkName,
      coin: this.navParams.data.coin,
      txp: {}
    };
    this.tx.origToAddress = this.tx.toAddress;

    if (this.navParams.data.requiredFeeRate) {
      this.usingMerchantFee = true;
      this.tx.feeRate = +this.navParams.data.requiredFeeRate;
    } else {
      this.tx.feeLevel =
        this.tx.coin && this.tx.coin == 'bch' ? 'normal ' : this.configFeeLevel;
    }

    if (this.tx.coin && this.tx.coin == 'bch' && !this.fromMultiSend) {
      // Use legacy address
      this.tx.toAddress = this.bitcoreCash
        .Address(this.tx.toAddress)
        .toString();
    }

    this.getAmountDetails();

    const feeOpts = this.feeProvider.getFeeOpts();
    this.tx.feeLevelName = feeOpts[this.tx.feeLevel];
    this.showAddress = false;
    this.walletSelectorTitle = this.translate.instant('Send from');

    this.setWalletSelector(this.tx.coin, this.tx.network, this.tx.amount)
      .then(() => {
        this.afterWalletSelectorSet();
      })
      .catch(err => {
        this.showErrorInfoSheet(err, null, true);
      });
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: ConfirmPage');
  }

  private getAmountDetails() {
    this.amount = this.decimalPipe.transform(this.tx.amount / 1e8, '1.2-6');
  }

  private afterWalletSelectorSet() {
    const parentWallet = this.getParentWallet();
    if (
      parentWallet &&
      this.tx.coin === parentWallet.coin &&
      this.tx.network === parentWallet.network
    ) {
      this.setWallet(parentWallet);
    } else if (this.wallets.length > 1) {
      return this.showWallets();
    } else if (this.wallets.length) {
      this.setWallet(this.wallets[0]);
    }
  }

  private setWalletSelector(
    coin: string,
    network: string,
    minAmount: number
  ): Promise<any> {
    const parentWallet = this.getParentWallet();
    if (
      parentWallet &&
      (parentWallet.network == network && parentWallet.coin == coin)
    ) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      // no min amount? (sendMax) => look for no empty wallets
      minAmount = minAmount ? minAmount : 1;
      const filteredWallets = [];
      let index: number = 0;
      let walletsUpdated: number = 0;

      this.wallets = this.profileProvider.getWallets({
        onlyComplete: true,
        network,
        coin
      });

      if (!this.wallets || !this.wallets.length) {
        return reject(this.translate.instant('No wallets available'));
      }

      _.each(this.wallets, wallet => {
        this.walletProvider
          .getStatus(wallet, {})
          .then(status => {
            walletsUpdated++;
            wallet.status = status;

            if (!status.availableBalanceSat) {
              this.logger.debug('No balance available in: ' + wallet.name);
            }

            if (status.availableBalanceSat > minAmount) {
              filteredWallets.push(wallet);
            }

            if (++index == this.wallets.length) {
              if (!walletsUpdated) return reject('Could not update any wallet');

              if (_.isEmpty(filteredWallets)) {
                return reject(this.translate.instant('Insufficient funds'));
              }
              this.wallets = _.clone(filteredWallets);
              return resolve();
            }
          })
          .catch(err => {
            this.logger.error(err);
            if (++index == this.wallets.length) {
              if (!walletsUpdated) return reject('Could not update any wallet');

              if (_.isEmpty(filteredWallets)) {
                return reject(
                  this.translate.instant('Insufficient funds for fee')
                );
              }
              this.wallets = _.clone(filteredWallets);
              return resolve();
            }
          });
      });
    });
  }

  /* sets a wallet on the UI, creates a TXPs for that wallet */

  private setWallet(wallet): void {
    this.wallet = wallet;

    // If select another wallet
    this.tx.coin = this.wallet.coin;

    if (!this.usingCustomFee && !this.usingMerchantFee) {
      this.tx.feeLevel = wallet.coin == 'bch' ? 'normal' : this.configFeeLevel;
    }

    this.setButtonText(this.wallet.credentials.m > 1, !!this.tx.paypro);

    if (this.tx.paypro) this.paymentTimeControl(this.tx.paypro.expires);

    const feeOpts = this.feeProvider.getFeeOpts();
    this.tx.feeLevelName = feeOpts[this.tx.feeLevel];
    this.updateTx(this.tx, this.wallet, { dryRun: true }).catch(err => {
      const previousView = this.navCtrl.getPrevious().name;
      switch (err) {
        case 'insufficient_funds':
          // Do not allow user to change or use max amount if previous view is not Amount
          if (previousView === 'AmountPage') {
            this.showInsufficientFundsInfoSheet();
          } else {
            this.showErrorInfoSheet(
              this.translate.instant('Insufficient funds'),
              null,
              true
            );
          }
          break;
        default:
          this.showErrorInfoSheet(err);
          break;
      }
    });
  }

  private setButtonText(isMultisig: boolean, isPayPro: boolean): void {
    if (isPayPro) {
      this.buttonText = this.isCordova
        ? this.translate.instant('Slide to pay')
        : this.translate.instant('Click to pay');
    } else if (isMultisig) {
      this.buttonText = this.isCordova
        ? this.translate.instant('Slide to accept')
        : this.translate.instant('Click to accept');
      this.successText =
        this.wallet.credentials.n == 1
          ? this.translate.instant('Payment Sent')
          : this.translate.instant('Proposal created');
    } else {
      this.buttonText = this.isCordova
        ? this.translate.instant('Slide to send')
        : this.translate.instant('Click to send');
      this.successText = this.translate.instant('Payment Sent');
    }
  }

  private paymentTimeControl(expirationTime: number): void {
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

      const maxAllowedMerchantFee = {
        btc: 'urgent',
        bch: 'normal'
      };

      this.onGoingProcessProvider.set('calculatingFee');
      this.feeProvider
        .getFeeRate(
          wallet.coin,
          tx.network,
          this.usingMerchantFee
            ? maxAllowedMerchantFee[wallet.coin]
            : this.tx.feeLevel
        )
        .then(feeRate => {
          let msg;
          if (this.usingCustomFee) {
            msg = this.translate.instant('Custom');
            tx.feeLevelName = msg;
          } else if (this.usingMerchantFee) {
            const maxAllowedFee = feeRate * 2;
            this.logger.info(
              'Using Merchant Fee:' +
                tx.feeRate +
                ' vs. referent level:' +
                maxAllowedFee
            );
            if (tx.network != 'testnet' && tx.feeRate > maxAllowedFee) {
              this.onGoingProcessProvider.set('calculatingFee');
              return reject(
                this.translate.instant(
                  'Merchant fee too high. Payment rejected'
                )
              );
            }

            msg = this.translate.instant('Suggested by Merchant');
            tx.feeLevelName = msg;
          } else {
            const feeOpts = this.feeProvider.getFeeOpts();
            tx.feeLevelName = feeOpts[tx.feeLevel];
            tx.feeRate = feeRate;
          }

          // call getSendMaxInfo if was selected from amount view
          if (tx.sendMax) {
            this.useSendMax(tx, wallet, opts)
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

            if (sendMaxInfo.amount == 0) {
              this.showErrorInfoSheet(
                this.translate.instant('Not enough funds for fee')
              );
              return resolve();
            }
            tx.sendMaxInfo = sendMaxInfo;
            tx.amount = tx.sendMaxInfo.amount;
            this.getAmountDetails();
          }
          this.showSendMaxWarning(wallet, sendMaxInfo);
          // txp already generated for this wallet?
          if (tx.txp[wallet.id]) {
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

  protected getFeeRate(amount: number, fee: number) {
    return (fee / (amount + fee)) * 100;
  }

  protected isHighFee(amount: number, fee: number) {
    return this.getFeeRate(amount, fee) > this.FEE_TOO_HIGH_LIMIT_PER;
  }

  protected showHighFeeSheet() {
    const coinName = this.wallet.coin === 'btc' ? 'Bitcoin' : 'Bitcoin Cash';
    const minerFeeInfoSheet = this.actionSheetProvider.createInfoSheet(
      'miner-fee',
      { coinName }
    );
    minerFeeInfoSheet.present();
  }

  private buildTxp(tx, wallet, opts): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getTxp(_.clone(tx), wallet, opts.dryRun)
        .then(txp => {
          const per = this.getFeeRate(txp.amount, txp.fee);
          txp.feeRatePerStr = per.toFixed(2) + '%';
          txp.feeTooHigh = this.isHighFee(txp.amount, txp.fee);

          if (txp.feeTooHigh) {
            this.showHighFeeSheet();
          }

          tx.txp[wallet.id] = txp;
          this.tx = tx;
          this.logger.debug(
            'Confirm. TX Fully Updated for wallet:' + wallet.id,
            JSON.stringify(tx)
          );
          return resolve();
        })
        .catch(err => {
          if (err.message == 'Insufficient funds') {
            return reject('insufficient_funds');
          } else {
            return reject(err);
          }
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

  private showSendMaxWarning(wallet, sendMaxInfo): void {
    if (!sendMaxInfo) return;

    const warningMsg = this.verifyExcludedUtxos(wallet, sendMaxInfo);

    const coinName =
      this.wallet.coin === Coin.BTC ? 'Bitcoin (BTC)' : 'Bitcoin Cash (BCH)';

    const minerFeeNoticeInfoSheet = this.actionSheetProvider.createInfoSheet(
      'miner-fee-notice',
      {
        coinName,
        fee: sendMaxInfo.fee / 1e8,
        coin: this.tx.coin.toUpperCase(),
        msg: !_.isEmpty(warningMsg) ? warningMsg : ''
      }
    );
    minerFeeNoticeInfoSheet.present();
  }

  private verifyExcludedUtxos(_, sendMaxInfo) {
    const warningMsg = [];
    if (sendMaxInfo.utxosBelowFee > 0) {
      const amountBelowFeeStr = sendMaxInfo.amountBelowFee / 1e8;
      const message = this.replaceParametersProvider.replace(
        this.translate.instant(
          'A total of {{amountBelowFeeStr}} {{coin}} were excluded. These funds come from UTXOs smaller than the network fee provided.'
        ),
        { amountBelowFeeStr, coin: this.tx.coin.toUpperCase() }
      );
      warningMsg.push(message);
    }

    if (sendMaxInfo.utxosAboveMaxSize > 0) {
      const amountAboveMaxSizeStr = sendMaxInfo.amountAboveMaxSize / 1e8;
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

      if (tx.amount > Number.MAX_SAFE_INTEGER) {
        const msg = this.translate.instant('Amount too big');
        return reject(msg);
      }

      const txp: Partial<TransactionProposal> = {};

      if (this.fromMultiSend) {
        txp.outputs = [];
        this.navParams.data.recipients.forEach(recipient => {
          if (tx.coin && tx.coin == 'bch') {
            // Use legacy address
            recipient.toAddress = this.bitcoreCash
              .Address(recipient.toAddress)
              .toString();

            recipient.addressToShow = this.walletProvider.getAddressView(
              tx.coin,
              tx.network,
              recipient.toAddress
            );
          }

          txp.outputs.push({
            toAddress: recipient.toAddress,
            amount: recipient.amount,
            message: tx.description
          });
        });
      } else {
        txp.outputs = [
          {
            toAddress: tx.toAddress,
            amount: tx.amount,
            message: tx.description
          }
        ];
      }

      if (tx.sendMaxInfo) {
        txp.inputs = tx.sendMaxInfo.inputs;
        txp.fee = tx.sendMaxInfo.fee;
      } else {
        if (this.usingCustomFee || this.usingMerchantFee) {
          txp.feePerKb = tx.feeRate;
        } else txp.feeLevel = tx.feeLevel;
      }

      txp.message = tx.description;

      if (tx.paypro) {
        txp.payProUrl = tx.paypro.url;
      }
      txp.excludeUnconfirmedUtxos = !tx.spendUnconfirmed;
      txp.dryRun = dryRun;

      if (tx.recipientType == 'wallet') {
        txp.customData = {
          toWalletName: tx.name ? tx.name : null
        };
      }

      this.walletProvider
        .createTx(wallet, txp)
        .then(ctxp => {
          return resolve(ctxp);
        })
        .catch(err => {
          return reject(err);
        });
    });
  }

  private showInsufficientFundsInfoSheet(): void {
    const insufficientFundsInfoSheet = this.actionSheetProvider.createInfoSheet(
      'insufficient-funds',
      { amount: this.amount, coin: this.tx.coin }
    );
    insufficientFundsInfoSheet.present();
    insufficientFundsInfoSheet.onDidDismiss(option => {
      if (option || typeof option === 'undefined') {
        this.isWithinWalletTabs()
          ? this.navCtrl.pop()
          : this.app.getRootNavs()[0].setRoot(TabsPage);
      } else {
        this.tx.sendMax = true;
        this.setWallet(this.wallet);
      }
    });
  }

  public showErrorInfoSheet(
    error: Error | string,
    title?: string,
    exit?: boolean
  ): void {
    if (!error) return;
    this.logger.warn('ERROR:', error);
    if (this.isCordova) this.slideButton.isConfirmed(false);
    if (
      (error as Error).message === 'FINGERPRINT_CANCELLED' ||
      (error as Error).message === 'PASSWORD_CANCELLED'
    ) {
      this.hideSlideButton = false;
      return;
    }
    const infoSheetTitle = title ? title : this.translate.instant('Error');

    const errorInfoSheet = this.actionSheetProvider.createInfoSheet(
      'default-error',
      { msg: this.bwcErrorProvider.msg(error), title: infoSheetTitle }
    );
    errorInfoSheet.present();
    errorInfoSheet.onDidDismiss(() => {
      this.hideSlideButton = false;
      if (exit) {
        this.isWithinWalletTabs()
          ? this.navCtrl.popToRoot()
          : this.navCtrl.last().name == 'ConfirmCardPurchasePage'
          ? this.navCtrl.pop()
          : this.app.getRootNavs()[0].setRoot(TabsPage);
      }
    });
  }

  public toggleAddress(): void {
    this.showAddress = !this.showAddress;
  }

  public onWalletSelect(wallet): void {
    this.setWallet(wallet);
  }

  public showDescriptionPopup(tx) {
    const message = this.translate.instant('Add Memo');
    const opts = {
      defaultText: tx.description
    };
    this.popupProvider.ionicPrompt(null, message, opts).then((res: string) => {
      if (res) {
        tx.description = res;
      }
    });
  }

  public approve(tx, wallet): Promise<void> {
    if (!tx || !wallet) return undefined;

    this.hideSlideButton = true;
    if (this.paymentExpired) {
      this.showErrorInfoSheet(
        this.translate.instant('This bitcoin payment request has expired.')
      );
      return undefined;
    }

    this.onGoingProcessProvider.set('creatingTx');
    return this.getTxp(_.clone(tx), wallet, false)
      .then(txp => {
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
  }

  private confirmTx(txp, wallet) {
    return new Promise<boolean>(resolve => {
      if (this.walletProvider.isEncrypted(wallet)) return resolve(false);
      this.txFormatProvider.formatToUSD(wallet.coin, txp.amount).then(val => {
        const amountUsd = parseFloat(val);
        if (amountUsd <= this.CONFIRM_LIMIT_USD) return resolve(false);

        const amount = (this.tx.amount / 1e8).toFixed(8);
        const unit = txp.coin.toUpperCase();
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
    if (!wallet.canSign() && !wallet.isPrivKeyExternal()) {
      return this.onlyPublish(txp, wallet);
    }

    return this.walletProvider
      .publishAndSign(wallet, txp)
      .then(txp => {
        this.onGoingProcessProvider.clear();
        if (
          this.config.confirmedTxsNotifications &&
          this.config.confirmedTxsNotifications.enabled
        ) {
          this.txConfirmNotificationProvider.subscribe(wallet, {
            txid: txp.txid
          });
        }
        return this.openFinishModal();
      })
      .catch(err => {
        if (this.isCordova) this.slideButton.isConfirmed(false);
        this.onGoingProcessProvider.clear();
        this.showErrorInfoSheet(err);
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

  protected async openFinishModal(onlyPublish?: boolean) {
    let params: { finishText: string; finishComment?: string } = {
      finishText: this.successText
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
      'BitcoinCashUri'
    ]);

    if (this.isWithinWalletTabs()) {
      this.close().then(() => {
        this.events.publish('OpenWallet', this.wallet);
      });
    } else {
      this.app.getRootNavs()[0].setRoot(TabsPage);
      this.events.publish('OpenWallet', this.wallet);
    }
  }

  public openPPModal(): void {
    if (!this.wallet) return;
    const modal = this.modalCtrl.create(
      PayProPage,
      {
        tx: this.tx,
        wallet: this.wallet
      },
      {
        showBackdrop: true,
        enableBackdropDismiss: true
      }
    );
    modal.present();
  }

  public chooseFeeLevel(): void {
    if (this.tx.coin == 'bch') return;
    if (this.usingMerchantFee) return; // TODO: should we allow override?

    const txObject = {
      network: this.tx.network,
      feeLevel: this.tx.feeLevel,
      noSave: true,
      coin: this.tx.coin,
      customFeePerKB: this.usingCustomFee ? this.tx.feeRate : undefined,
      feePerSatByte: this.usingCustomFee ? this.tx.feeRate / 1000 : undefined
    };

    const myModal = this.modalCtrl.create(ChooseFeeLevelPage, txObject, {
      showBackdrop: true,
      enableBackdropDismiss: false
    });

    myModal.present();

    myModal.onDidDismiss(data => {
      this.onFeeModalDismiss(data);
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
    const feeOpts = this.feeProvider.getFeeOpts();
    this.tx.feeLevelName = feeOpts[this.tx.feeLevel];
    if (this.usingCustomFee)
      this.tx.feeRate = parseInt(data.customFeePerKB, 10);

    this.updateTx(this.tx, this.wallet, {
      clearCache: true,
      dryRun: true
    }).catch(err => {
      this.logger.warn('Error updateTx', err);
    });
  }

  public showWallets(): void {
    this.isOpenSelector = true;
    const id = this.wallet ? this.wallet.credentials.walletId : null;
    const params = {
      wallets: this.wallets,
      selectedWalletId: id,
      title: this.walletSelectorTitle
    };
    const walletSelector = this.actionSheetProvider.createWalletSelector(
      params
    );
    walletSelector.present();
    walletSelector.onDidDismiss(wallet => {
      this.onSelectWalletEvent(wallet);
    });
  }

  private onSelectWalletEvent(wallet): void {
    if (!_.isEmpty(wallet)) this.onWalletSelect(wallet);
    this.isOpenSelector = false;
  }
}
