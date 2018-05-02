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
import { FeeWarningPage } from '../fee-warning/fee-warning';

// Providers
import { BwcErrorProvider } from '../../../providers/bwc-error/bwc-error';
import { BwcProvider } from '../../../providers/bwc/bwc';
import { ConfigProvider } from '../../../providers/config/config';
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';
import { FeeProvider } from '../../../providers/fee/fee';
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { PlatformProvider } from '../../../providers/platform/platform';
import { PopupProvider } from '../../../providers/popup/popup';
import { ProfileProvider } from '../../../providers/profile/profile';
import { TxConfirmNotificationProvider } from '../../../providers/tx-confirm-notification/tx-confirm-notification';
import { TxFormatProvider } from '../../../providers/tx-format/tx-format';
import { WalletProvider } from '../../../providers/wallet/wallet';

@Component({
  selector: 'page-confirm',
  templateUrl: 'confirm.html'
})
export class ConfirmPage {
  @ViewChild('slideButton') slideButton;

  private bitcore: any;
  private bitcoreCash: any;

  public countDown = null;
  public CONFIRM_LIMIT_USD: number;
  public FEE_TOO_HIGH_LIMIT_PER: number;

  public tx: any;
  public wallet: any;
  public wallets: any;
  public noWalletMessage: string;
  public criticalError: boolean;
  public showAddress: boolean;
  public walletSelectorTitle: string;
  public buttonText: string;
  public successText: string;
  public paymentExpired: boolean;
  public remainingTimeStr: string;

  // Config Related values
  public config: any;
  public configFeeLevel: string;

  // Platform info
  public isCordova: boolean;

  // custom fee flag
  public usingCustomFee: boolean = false;
  public usingMerchantFee: boolean = false;

  public isOpenSelector: boolean;

  constructor(
    private app: App,
    private bwcProvider: BwcProvider,
    private navCtrl: NavController,
    private navParams: NavParams,
    private logger: Logger,
    private configProvider: ConfigProvider,
    private platformProvider: PlatformProvider,
    private profileProvider: ProfileProvider,
    private walletProvider: WalletProvider,
    private popupProvider: PopupProvider,
    private bwcErrorProvider: BwcErrorProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private feeProvider: FeeProvider,
    private txConfirmNotificationProvider: TxConfirmNotificationProvider,
    private modalCtrl: ModalController,
    private txFormatProvider: TxFormatProvider,
    private events: Events,
    private translate: TranslateService,
    private externalLinkProvider: ExternalLinkProvider
  ) {
    this.bitcore = this.bwcProvider.getBitcore();
    this.bitcoreCash = this.bwcProvider.getBitcoreCash();
    this.CONFIRM_LIMIT_USD = 20;
    this.FEE_TOO_HIGH_LIMIT_PER = 15;
    this.config = this.configProvider.get();
    this.configFeeLevel = this.config.wallet.settings.feeLevel
      ? this.config.wallet.settings.feeLevel
      : 'normal';
    this.isCordova = this.platformProvider.isCordova;
  }

  ionViewWillLeave() {
    this.navCtrl.swipeBackEnabled = true;
  }

  ionViewWillEnter() {
    this.navCtrl.swipeBackEnabled = false;
    this.isOpenSelector = false;
    let B = this.navParams.data.coin == 'bch' ? this.bitcoreCash : this.bitcore;
    let networkName;
    try {
      networkName = new B.Address(this.navParams.data.toAddress).network.name;
    } catch (e) {
      var message = this.translate.instant(
        'Copay only supports Bitcoin Cash using new version numbers addresses'
      );
      var backText = this.translate.instant('Go back');
      var learnText = this.translate.instant('Learn more');
      this.popupProvider
        .ionicConfirm(null, message, backText, learnText)
        .then(back => {
          if (!back) {
            var url =
              'https://support.bitpay.com/hc/en-us/articles/115004671663';
            this.externalLinkProvider.open(url);
          }
          this.navCtrl.pop();
        });
      return;
    }

    this.tx = {
      toAddress: this.navParams.data.toAddress,
      amount: parseInt(this.navParams.data.amount, 10),
      sendMax: this.navParams.data.useSendMax ? true : false,
      description: this.navParams.data.description,
      paypro: this.navParams.data.paypro,
      spendUnconfirmed: this.config.wallet.spendUnconfirmed,

      // Vanity tx info (not in the real tx)
      recipientType: this.navParams.data.recipientType,
      name: this.navParams.data.name,
      email: this.navParams.data.email,
      color: this.navParams.data.color,
      network: networkName,
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

    if (this.tx.coin && this.tx.coin == 'bch') {
      // Use legacy address
      this.tx.toAddress = this.bitcoreCash
        .Address(this.tx.toAddress)
        .toString();
    }

    this.tx.feeLevelName = this.feeProvider.feeOpts[this.tx.feeLevel];
    this.showAddress = false;
    this.walletSelectorTitle = this.translate.instant('Send from');

    this.setWalletSelector(this.tx.coin, this.tx.network, this.tx.amount)
      .then(() => {
        this.afterWalletSelectorSet();
      })
      .catch((err: any) => {
        this.logger.error(err);
        return this.exitWithError(err);
      });
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad ConfirmPage');
  }

  private afterWalletSelectorSet() {
    if (this.wallets.length > 1) {
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
    return new Promise((resolve, reject) => {
      // no min amount? (sendMax) => look for no empty wallets
      minAmount = minAmount ? minAmount : 1;
      let filteredWallets: any[] = [];
      let index: number = 0;
      let walletsUpdated: number = 0;

      this.wallets = this.profileProvider.getWallets({
        onlyComplete: true,
        network,
        coin
      });

      if (!this.wallets || !this.wallets.length) {
        this.setNoWallet(this.translate.instant('No wallets available'), true);
        return resolve();
      }

      _.each(this.wallets, (wallet: any) => {
        this.walletProvider
          .getStatus(wallet, {})
          .then((status: any) => {
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
                this.setNoWallet(
                  this.translate.instant('Insufficient funds'),
                  true
                );
                return reject('Insufficient funds');
              }
              this.wallets = _.clone(filteredWallets);
              return resolve();
            }
          })
          .catch((err: any) => {
            this.logger.error(err);
            if (++index == this.wallets.length) {
              if (!walletsUpdated) return reject('Could not update any wallet');

              if (_.isEmpty(filteredWallets)) {
                this.setNoWallet(
                  this.translate.instant('Insufficient funds'),
                  true
                );
                return reject('Insufficient funds for fee');
              }
              this.wallets = _.clone(filteredWallets);
              return resolve();
            }
          });
      });
    });
  }

  private setNoWallet(msg: string, criticalError?: boolean) {
    this.wallet = null;
    this.noWalletMessage = msg;
    this.criticalError = criticalError;
    this.logger.warn('Not ready to make the payment: ' + msg);
  }

  private exitWithError(err: any) {
    this.logger.info('Error setting wallet selector:' + err);
    this.popupProvider
      .ionicAlert('', this.bwcErrorProvider.msg(err))
      .then(() => {
        this.app.getRootNavs()[0].setRoot(TabsPage);
      });
  }

  /* sets a wallet on the UI, creates a TXPs for that wallet */

  private setWallet(wallet: any): void {
    this.wallet = wallet;

    // If select another wallet
    this.tx.coin = this.wallet.coin;

    if (!this.usingCustomFee && !this.usingMerchantFee) {
      this.tx.feeLevel = wallet.coin == 'bch' ? 'normal' : this.configFeeLevel;
    }

    this.setButtonText(this.wallet.credentials.m > 1, !!this.tx.paypro);

    if (this.tx.paypro) this.paymentTimeControl(this.tx.paypro.expires);

    this.tx.feeLevelName = this.feeProvider.feeOpts[this.tx.feeLevel];
    this.updateTx(this.tx, this.wallet, { dryRun: true }).catch((err: any) => {
      this.logger.warn('Error in updateTx: ', err);
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

    let countDown: any = setInterval(() => {
      this.setExpirationTime(expirationTime, countDown);
    }, 1000);
  }

  private setExpirationTime(expirationTime: number, countDown?: any): void {
    let now = Math.floor(Date.now() / 1000);

    if (now > expirationTime) {
      this.paymentExpired = true;
      this.remainingTimeStr = this.translate.instant('Expired');
      if (countDown) {
        /* later */
        clearInterval(countDown);
      }
      return;
    }

    let totalSecs = expirationTime - now;
    let m = Math.floor(totalSecs / 60);
    let s = totalSecs % 60;
    this.remainingTimeStr = ('0' + m).slice(-2) + ':' + ('0' + s).slice(-2);
  }

  private updateTx(tx: any, wallet: any, opts: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (opts.clearCache) {
        tx.txp = {};
      }

      this.tx = tx;

      // End of quick refresh, before wallet is selected.
      if (!wallet) {
        return resolve();
      }

      let maxAllowedMerchantFee = {
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
        .then((feeRate: any) => {
          let msg;
          if (this.usingCustomFee) {
            msg = this.translate.instant('Custom');
            tx.feeLevelName = msg;
          } else if (this.usingMerchantFee) {
            let maxAllowedfee = feeRate * 2;
            this.logger.info(
              'Using Merchant Fee:' +
                tx.feeRate +
                ' vs. referent level:' +
                maxAllowedfee
            );
            if (tx.network != 'testnet' && tx.feeRate > maxAllowedfee) {
              this.onGoingProcessProvider.set('calculatingFee');
              this.setNoWallet(
                this.translate.instant(
                  'Merchant fee too high. Payment rejected'
                ),
                true
              );
              return reject('fee_too_high');
            }

            msg = this.translate.instant('Suggested by Merchant');
            tx.feeLevelName = msg;
          } else {
            tx.feeLevelName = this.feeProvider.feeOpts[tx.feeLevel];
            tx.feeRate = feeRate;
          }

          // call getSendMaxInfo if was selected from amount view
          if (tx.sendMax) {
            this.useSendMax(tx, wallet, opts)
              .then(() => {
                return resolve();
              })
              .catch((err: any) => {
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
              .catch((err: any) => {
                this.onGoingProcessProvider.clear();
                return reject(err);
              });
          }
        })
        .catch((err: any) => {
          this.logger.warn('Error getting fee rate', err);
          this.onGoingProcessProvider.clear();
          return reject(err);
        });
    });
  }

  private useSendMax(tx: any, wallet: any, opts: any) {
    return new Promise((resolve, reject) => {
      this.getSendMaxInfo(_.clone(tx), wallet)
        .then((sendMaxInfo: any) => {
          if (sendMaxInfo) {
            this.logger.debug('Send max info', sendMaxInfo);

            if (sendMaxInfo.amount == 0) {
              this.setNoWallet(
                this.translate.instant('Insufficient funds for fee'),
                false
              );
              this.popupProvider
                .ionicAlert(
                  this.translate.instant('Error'),
                  this.translate.instant('Not enough funds for fee')
                )
                .then(() => {
                  return resolve('no_funds');
                });
            }
            tx.sendMaxInfo = sendMaxInfo;
            tx.amount = tx.sendMaxInfo.amount;
          }
          this.showSendMaxWarning(wallet, sendMaxInfo).then(() => {
            // txp already generated for this wallet?
            if (tx.txp[wallet.id]) {
              return resolve();
            }

            this.buildTxp(tx, wallet, opts)
              .then(() => {
                return resolve();
              })
              .catch((err: any) => {
                return reject(err);
              });
          });
        })
        .catch((err: any) => {
          let msg = this.translate.instant('Error getting SendMax information');
          return reject(msg);
        });
    });
  }

  private buildTxp(tx: any, wallet: any, opts: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getTxp(_.clone(tx), wallet, opts.dryRun)
        .then((txp: any) => {
          let per = txp.fee / (txp.amount + txp.fee) * 100;
          txp.feeRatePerStr = per.toFixed(2) + '%';
          txp.feeTooHigh = per > this.FEE_TOO_HIGH_LIMIT_PER;

          if (txp.feeTooHigh) {
            let feeWarningModal = this.modalCtrl.create(
              FeeWarningPage,
              {},
              { showBackdrop: false, enableBackdropDismiss: false }
            );
            feeWarningModal.present();
          }

          tx.txp[wallet.id] = txp;
          this.tx = tx;
          this.logger.debug(
            'Confirm. TX Fully Updated for wallet:' + wallet.id,
            JSON.stringify(tx)
          );
          return resolve();
        })
        .catch((err: any) => {
          if (err.message == 'Insufficient funds') {
            this.setNoWallet(this.translate.instant('Insufficient funds'));
            this.popupProvider.ionicAlert(
              this.translate.instant('Error'),
              this.translate.instant('Not enough funds for fee')
            );
            return reject('no_funds');
          } else {
            return reject(err);
          }
        });
    });
  }

  private getSendMaxInfo(tx: any, wallet: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!tx.sendMax) return resolve();

      this.onGoingProcessProvider.set('retrievingInputs');
      this.walletProvider
        .getSendMaxInfo(wallet, {
          feePerKb: tx.feeRate,
          excludeUnconfirmedUtxos: !tx.spendUnconfirmed,
          returnInputs: true
        })
        .then((res: any) => {
          this.onGoingProcessProvider.clear();
          return resolve(res);
        })
        .catch((err: any) => {
          this.onGoingProcessProvider.clear();
          this.logger.warn('Error getting send max info', err);
          return reject(err);
        });
    });
  }

  private showSendMaxWarning(wallet: any, sendMaxInfo: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!sendMaxInfo) return resolve();

      let fee = sendMaxInfo.fee / 1e8;
      let msg =
        fee +
        ' ' +
        this.tx.coin.toUpperCase() +
        ' will be deducted for bitcoin networking fees.'; // TODO: translate
      let warningMsg = this.verifyExcludedUtxos(wallet, sendMaxInfo);

      if (!_.isEmpty(warningMsg)) msg += '\n' + warningMsg;

      this.popupProvider.ionicAlert(null, msg).then(() => {
        return resolve();
      });
    });
  }

  private verifyExcludedUtxos(wallet: any, sendMaxInfo: any): any {
    let warningMsg = [];
    if (sendMaxInfo.utxosBelowFee > 0) {
      let amountBelowFeeStr = sendMaxInfo.amountBelowFee / 1e8;
      let message =
        'A total of ' +
        amountBelowFeeStr +
        ' ' +
        this.tx.coin.toUpperCase() +
        ' were excluded. These funds come from UTXOs smaller than the network fee provided.'; // TODO: translate
      warningMsg.push(message);
    }

    if (sendMaxInfo.utxosAboveMaxSize > 0) {
      let amountAboveMaxSizeStr = sendMaxInfo.amountAboveMaxSize / 1e8;
      let message =
        'A total of ' +
        amountAboveMaxSizeStr +
        ' ' +
        this.tx.coin.toUpperCase() +
        ' were excluded. The maximum size allowed for a transaction was exceeded.'; // TODO: translate
      warningMsg.push(message);
    }
    return warningMsg.join('\n');
  }

  private getTxp(tx: any, wallet: any, dryRun: boolean): Promise<any> {
    return new Promise((resolve, reject) => {
      // ToDo: use a credential's (or fc's) function for this
      if (tx.description && !wallet.credentials.sharedEncryptingKey) {
        let msg = this.translate.instant(
          'Could not add message to imported wallet without shared encrypting key'
        );
        this.setSendError(msg);
        return reject(msg);
      }

      if (tx.amount > Number.MAX_SAFE_INTEGER) {
        let msg = this.translate.instant('Amount too big');
        this.setSendError(msg);
        return reject(msg);
      }

      let txp: any = {};

      txp.outputs = [
        {
          toAddress: tx.toAddress,
          amount: tx.amount,
          message: tx.description
        }
      ];

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

      this.walletProvider
        .createTx(wallet, txp)
        .then((ctxp: any) => {
          return resolve(ctxp);
        })
        .catch((err: any) => {
          this.setSendError(err);
          return reject(err);
        });
    });
  }

  private setSendError(msg: string, title: string = '') {
    if (this.isCordova) this.slideButton.isConfirmed(false);
    this.popupProvider.ionicAlert(
      this.translate.instant('Error at ' + title),
      this.bwcErrorProvider.msg(msg)
    );
  }

  public toggleAddress(): void {
    this.showAddress = !this.showAddress;
  }

  public onWalletSelect(wallet: any): void {
    this.setWallet(wallet);
  }

  public showDescriptionPopup(tx) {
    let message = this.translate.instant('Add description');
    let opts = {
      defaultText: tx.description
    };
    this.popupProvider.ionicPrompt(null, message, opts).then((res: string) => {
      if (res) {
        tx.description = res;
      }
    });
  }

  public approve(tx: any, wallet: any): Promise<void> {
    if (!tx || !wallet) return;

    if (this.paymentExpired) {
      this.popupProvider.ionicAlert(
        null,
        this.translate.instant('This bitcoin payment request has expired.')
      );
      return;
    }

    this.onGoingProcessProvider.set('creatingTx');
    return this.getTxp(_.clone(tx), wallet, false)
      .then((txp: any) => {
        return this.confirmTx(tx, txp, wallet).then((nok: boolean) => {
          if (nok) {
            if (this.isCordova) this.slideButton.isConfirmed(false);
            this.onGoingProcessProvider.clear();
            return;
          }
          this.publishAndSign(txp, wallet);
        });
      })
      .catch((err: any) => {
        this.onGoingProcessProvider.clear();
        this.logger.warn('Error getting transaction proposal', err);
        return;
      });
  }

  private confirmTx(tx, txp, wallet): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.walletProvider.isEncrypted(wallet)) return resolve();
      this.txFormatProvider.formatToUSD(wallet.coin, txp.amount).then(val => {
        let amountUsd = parseFloat(val);
        if (amountUsd <= this.CONFIRM_LIMIT_USD) return resolve();

        let amount = (this.tx.amount / 1e8).toFixed(8);
        let unit = txp.coin.toUpperCase();
        let name = wallet.name;
        let message =
          'Sending ' + amount + ' ' + unit + ' from your ' + name + ' wallet'; // TODO: translate
        let okText = this.translate.instant('Confirm');
        let cancelText = this.translate.instant('Cancel');
        this.popupProvider
          .ionicConfirm(null, message, okText, cancelText)
          .then((ok: boolean) => {
            return resolve(!ok);
          });
      });
    });
  }

  private publishAndSign = (txp, wallet): void => {
    if (!wallet.canSign() && !wallet.isPrivKeyExternal()) {
      this.onlyPublish(txp, wallet);
      return;
    }

    this.walletProvider
      .publishAndSign(wallet, txp)
      .then((txp: any) => {
        this.onGoingProcessProvider.clear();
        if (
          this.config.confirmedTxsNotifications &&
          this.config.confirmedTxsNotifications.enabled
        ) {
          this.txConfirmNotificationProvider.subscribe(wallet, {
            txid: txp.txid
          });
        }
        this.openFinishModal();
      })
      .catch((err: any) => {
        this.onGoingProcessProvider.clear();
        this.setSendError(err);
        return;
      });
  };

  private onlyPublish(txp, wallet): Promise<void> {
    this.logger.info('No signing proposal: No private key');
    this.onGoingProcessProvider.set('sendingTx');
    return this.walletProvider
      .onlyPublish(wallet, txp)
      .then(() => {
        this.onGoingProcessProvider.clear();
        this.openFinishModal(true);
      })
      .catch((err: any) => {
        this.onGoingProcessProvider.clear();
        this.setSendError(err);
      });
  }

  private openFinishModal(onlyPublish?: boolean) {
    let params: any = { finishText: this.successText };
    if (onlyPublish) {
      let finishText = this.translate.instant('Payment Published');
      let finishComment = this.translate.instant(
        'You could sign the transaction later in your wallet details'
      );
      params = { finishText, finishComment };
    }
    let modal = this.modalCtrl.create(FinishModalPage, params, {
      showBackdrop: true,
      enableBackdropDismiss: false
    });
    modal.present();
    this.app.getRootNavs()[0].setRoot(TabsPage);
  }

  public openPPModal(): void {
    if (!this.wallet) return;
    let modal = this.modalCtrl.create(
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
    if (this.usingMerchantFee) return; // ToDo: should we allow overwride?

    let txObject: any = {};
    txObject.network = this.tx.network;
    txObject.feeLevel = this.tx.feeLevel;
    txObject.noSave = true;
    txObject.coin = this.tx.coin;

    if (this.usingCustomFee) {
      txObject.customFeePerKB = this.tx.feeRate;
      txObject.feePerSatByte = this.tx.feeRate / 1000;
    }

    const myModal = this.modalCtrl.create(ChooseFeeLevelPage, txObject, {
      showBackdrop: true,
      enableBackdropDismiss: false
    });

    myModal.present();

    myModal.onDidDismiss((data: any) => {
      this.onFeeModalDismiss(data);
    });
  }

  private onFeeModalDismiss(data: any) {
    if (_.isEmpty(data)) return;

    this.logger.debug(
      'New fee level choosen:' + data.newFeeLevel + ' was:' + this.tx.feeLevel
    );
    this.usingCustomFee = data.newFeeLevel == 'custom' ? true : false;

    if (this.tx.feeLevel == data.newFeeLevel && !this.usingCustomFee) {
      return;
    }

    this.tx.feeLevel = data.newFeeLevel;
    this.tx.feeLevelName = this.feeProvider.feeOpts[this.tx.feeLevel];
    if (this.usingCustomFee)
      this.tx.feeRate = parseInt(data.customFeePerKB, 10);

    this.updateTx(this.tx, this.wallet, {
      clearCache: true,
      dryRun: true
    }).catch((err: any) => {
      this.logger.warn('Error updateTx', err);
    });
  }

  public showWallets(): void {
    this.isOpenSelector = true;
    let id = this.wallet ? this.wallet.credentials.walletId : null;
    this.events.publish(
      'showWalletsSelectorEvent',
      this.wallets,
      id,
      this.walletSelectorTitle
    );
    this.events.subscribe('selectWalletEvent', (wallet: any) => {
      this.onSelectWalletEvent(wallet);
    });
  }

  private onSelectWalletEvent(wallet: any): void {
    if (!_.isEmpty(wallet)) this.onWalletSelect(wallet);
    this.events.unsubscribe('selectWalletEvent');
    this.isOpenSelector = false;
  }
}
