import { Component } from '@angular/core';
import { NavController, NavParams, ModalController, Events } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';
import * as _ from 'lodash';

// Pages
import { PayProPage } from '../../paypro/paypro';
import { ChooseFeeLevelPage } from '../choose-fee-level/choose-fee-level';
import { FeeWarningPage } from '../fee-warning/fee-warning';
import { SuccessModalPage } from '../../success/success';

// Providers
import { BwcProvider } from '../../../providers/bwc/bwc';
import { ConfigProvider } from '../../../providers/config/config';
import { PlatformProvider } from '../../../providers/platform/platform';
import { ProfileProvider } from '../../../providers/profile/profile';
import { WalletProvider } from '../../../providers/wallet/wallet';
import { PopupProvider } from '../../../providers/popup/popup';
import { BwcErrorProvider } from '../../../providers/bwc-error/bwc-error';
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { FeeProvider } from '../../../providers/fee/fee';
import { TxConfirmNotificationProvider } from '../../../providers/tx-confirm-notification/tx-confirm-notification';
import { TxFormatProvider } from '../../../providers/tx-format/tx-format';

@Component({
  selector: 'page-confirm',
  templateUrl: 'confirm.html',
})
export class ConfirmPage {

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
  public paymentExpired: boolean;
  public remainingTimeStr: string;

  // Config Related values
  public config: any;
  public configFeeLevel: string;

  // Platform info
  public isCordova: boolean;
  public isWindowsPhoneApp: boolean;

  //custom fee flag
  public usingCustomFee: boolean = false;

  constructor(
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
    private events: Events
  ) {
    this.bitcoreCash = this.bwcProvider.getBitcoreCash();
    this.CONFIRM_LIMIT_USD = 20;
    this.FEE_TOO_HIGH_LIMIT_PER = 15;
    this.config = this.configProvider.get();
    this.configFeeLevel = this.config.wallet.settings.feeLevel ? this.config.wallet.settings.feeLevel : 'normal';
    this.isCordova = this.platformProvider.isCordova;
    this.isWindowsPhoneApp = this.platformProvider.isCordova && this.platformProvider.isWP;
    this.tx = {
      toAddress: this.navParams.data.toAddress,
      amount: this.navParams.data.amount,
      sendMax: this.navParams.data.useSendMax ? true : false,
      description: this.navParams.data.description,
      paypro: this.navParams.data.paypro,
      feeLevel: this.configFeeLevel,
      spendUnconfirmed: this.config.wallet.spendUnconfirmed,

      // Vanity tx info (not in the real tx)
      recipientType: this.navParams.data.recipientType,
      name: this.navParams.data.name,
      email: this.navParams.data.email,
      color: this.navParams.data.color,
      network: this.navParams.data.network,
      coin: this.navParams.data.coin,
      txp: {},
    };
    this.tx.origToAddress = this.tx.toAddress;

    if (this.tx.coin && this.tx.coin == 'bch') {
      this.tx.feeLevel = 'normal';

      // Use legacy address
      this.tx.toAddress = this.bitcoreCash.Address(this.tx.toAddress).toString();
    }

    this.tx.feeLevelName = this.feeProvider.feeOpts[this.tx.feeLevel];
    this.showAddress = false;
    this.walletSelectorTitle = 'Send from'; // TODO gettextCatalog
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad ConfirmPage');
    this.setWalletSelector(this.tx.coin, this.tx.network, this.tx.amount).then(() => {
      if (this.wallets.length > 1) {
        this.showWallets();
      } else if (this.wallets.length) {
        this.setWallet(this.wallets[0]);
      }
    }).catch((err: any) => {
      this.logger.error(err);
      return this.exitWithError('Could not update wallets');
    });
  }

  private setWalletSelector(coin: string, network: string, minAmount: number): Promise<any> {
    return new Promise((resolve, reject) => {

      // no min amount? (sendMax) => look for no empty wallets
      minAmount = minAmount ? minAmount : 1;
      let filteredWallets: Array<any> = [];
      let index: number = 0;
      let walletsUpdated: number = 0;

      this.wallets = this.profileProvider.getWallets({
        onlyComplete: true,
        network: network,
        coin: coin
      });

      if (!this.wallets || !this.wallets.length) {
        this.setNoWallet('No wallets available', true); // TODO gettextCatalog
        return resolve();
      }

      _.each(this.wallets, (wallet: any) => {
        this.walletProvider.getStatus(wallet, {}).then((status: any) => {
          walletsUpdated++;
          wallet.status = status;

          if (!status.availableBalanceSat) {
            this.logger.debug('No balance available in: ' + wallet.name);
          }

          if (status.availableBalanceSat > minAmount) {
            filteredWallets.push(wallet);
          }

          if (++index == this.wallets.length) {
            if (!walletsUpdated)
              return reject('Could not update any wallet');

            if (_.isEmpty(filteredWallets)) {
              this.setNoWallet('Insufficient funds', true); // TODO gettextCatalog
            }
            this.wallets = _.clone(filteredWallets);
            return resolve();
          }
        }).catch((err: any) => {
          this.logger.error(err);
          if (++index == this.wallets.length) {
            if (!walletsUpdated)
              return reject('Could not update any wallet');

            if (_.isEmpty(filteredWallets)) {
              this.setNoWallet('Insufficient funds', true); // TODO gettextCatalog
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
  };

  private exitWithError(err: any) {
    this.logger.info('Error setting wallet selector:' + err);
    this.popupProvider.ionicAlert("", this.bwcErrorProvider.msg(err)).then(() => { // TODO gettextCatalog
      this.navCtrl.popToRoot();
    });
  };

  /* sets a wallet on the UI, creates a TXPs for that wallet */

  private setWallet(wallet: any): void {
    this.wallet = wallet;

    // If select another wallet
    this.tx.coin = this.wallet.coin;
    if (this.tx.coin == 'bch') this.tx.feeLevel = 'normal';

    this.setButtonText(this.wallet.credentials.m > 1, !!this.tx.paypro);

    if (this.tx.paypro)
      this.paymentTimeControl(this.tx.paypro.expires);

    this.tx.feeLevelName = this.feeProvider.feeOpts[this.tx.feeLevel];
    this.updateTx(this.tx, this.wallet, { dryRun: true }).catch((err: any) => {
      this.logger.warn(err);
    });
  }

  private setButtonText(isMultisig: boolean, isPayPro: boolean): void {
    if (isPayPro) {
      if (this.isCordova && !this.isWindowsPhoneApp) {
        this.buttonText = 'Slide to pay'; // TODO gettextCatalog
      } else {
        this.buttonText = 'Click to pay'; // TODO gettextCatalog
      }
    } else if (isMultisig) {
      if (this.isCordova && !this.isWindowsPhoneApp) {
        this.buttonText = 'Slide to accept'; // TODO gettextCatalog
      } else {
        this.buttonText = 'Click to accept'; // TODO gettextCatalog
      }
    } else {
      if (this.isCordova && !this.isWindowsPhoneApp) {
        this.buttonText = 'Slide to send'; // TODO gettextCatalog
      } else {
        this.buttonText = 'Click to send'; // TODO gettextCatalog
      }
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
      this.remainingTimeStr = 'Expired'; // TODO gettextCatalog
      if (countDown) {
        /* later */
        clearInterval(countDown);
      }
      return;
    }

    let totalSecs = expirationTime - now;
    let m = Math.floor(totalSecs / 60);
    let s = totalSecs % 60;
    this.remainingTimeStr = ('0' + m).slice(-2) + ":" + ('0' + s).slice(-2);
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

      this.onGoingProcessProvider.set('calculatingFee', true);
      this.feeProvider.getFeeRate(wallet.coin, tx.network, tx.feeLevel).then((feeRate: any) => {
        this.onGoingProcessProvider.set('calculatingFee', false);
        if (!this.usingCustomFee) tx.feeRate = feeRate;

        // call getSendMaxInfo if was selected from amount view
        if (tx.sendMax) {
          this.useSendMax(tx, wallet, opts).then(() => {
            return resolve();
          }).catch((err: any) => {
            return reject(err);
          });
        } else {
          // txp already generated for this wallet?
          if (tx.txp[wallet.id]) {
            return resolve();
          }

          this.buildTxp(tx, wallet, opts).then(() => {
            return resolve();
          }).catch((err: any) => {
            return reject(err);
          });
        }
      }).catch((err: any) => {
        return reject(err);
      });
    });

  }

  private useSendMax(tx: any, wallet: any, opts: any) {
    return new Promise((resolve, reject) => {
      this.getSendMaxInfo(_.clone(tx), wallet).then((sendMaxInfo: any) => {
        if (sendMaxInfo) {
          this.logger.debug('Send max info', sendMaxInfo);

          if (sendMaxInfo.amount == 0) {
            this.setNoWallet('Insufficient funds', false); // TODO gettextCatalog
            this.popupProvider.ionicAlert('Error', 'Not enough funds for fee').then(() => {
              return resolve('no_funds');
            }); // TODO gettextCatalog
          }

          tx.sendMaxInfo = sendMaxInfo;
          tx.amount = tx.sendMaxInfo.amount;
          setTimeout(() => {
            this.showSendMaxWarning(wallet, sendMaxInfo);
          }, 200);
        }

        // txp already generated for this wallet?
        if (tx.txp[wallet.id]) {
          return resolve();
        }

        this.buildTxp(tx, wallet, opts).then(() => {
          return resolve();
        }).catch((err: any) => {
          return reject(err);
        });

      }).catch((err: any) => {
        let msg = 'Error getting SendMax information'; // TODO gettextCatalog
        return reject(msg);
      });
    });
  }

  private buildTxp(tx: any, wallet: any, opts: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getTxp(_.clone(tx), wallet, opts.dryRun).then((txp: any) => {

        let per = (txp.fee / (txp.amount + txp.fee) * 100);
        txp.feeRatePerStr = per.toFixed(2) + '%';
        txp.feeTooHigh = per > this.FEE_TOO_HIGH_LIMIT_PER;

        if (txp.feeTooHigh) {
          let feeWarningModal = this.modalCtrl.create(FeeWarningPage, {}, { showBackdrop: false, enableBackdropDismiss: false });
          feeWarningModal.present();
        }

        tx.txp[wallet.id] = txp;
        this.tx = tx;
        this.logger.debug('Confirm. TX Fully Updated for wallet:' + wallet.id, JSON.stringify(tx));
        return resolve();
      }).catch((err: any) => {
        return reject(err);
      });
    });
  }

  private getSendMaxInfo(tx: any, wallet: any): Promise<any> {
    return new Promise((resolve, reject) => {

      if (!tx.sendMax) return resolve();

      this.onGoingProcessProvider.set('retrievingInputs', true);
      this.walletProvider.getSendMaxInfo(wallet, {
        feePerKb: tx.feeRate,
        excludeUnconfirmedUtxos: !tx.spendUnconfirmed,
        returnInputs: true,
      }).then((res: any) => {
        this.onGoingProcessProvider.set('retrievingInputs', false);
        resolve(res);
      }).catch((err: any) => {
        this.onGoingProcessProvider.set('retrievingInputs', false);
        this.logger.warn(err);
      });
    });
  }

  private showSendMaxWarning(wallet: any, sendMaxInfo: any): void {
    let fee = (sendMaxInfo.fee / 1e8);
    let msg = fee + " " + this.tx.coin.toUpperCase() + " will be deducted for bitcoin networking fees.";
    let warningMsg = this.verifyExcludedUtxos(wallet, sendMaxInfo);

    if (!_.isEmpty(warningMsg))
      msg += '\n' + warningMsg;

    this.popupProvider.ionicAlert(null, msg);
  }

  private verifyExcludedUtxos(wallet: any, sendMaxInfo: any): any {
    let warningMsg = [];
    if (sendMaxInfo.utxosBelowFee > 0) {
      let amountBelowFeeStr = (sendMaxInfo.amountBelowFee / 1e8);
      warningMsg.push("A total of " + amountBelowFeeStr + " " + this.tx.coin.toUpperCase() + " were excluded. These funds come from UTXOs smaller than the network fee provided.");// TODO gettextCatalog
    }

    if (sendMaxInfo.utxosAboveMaxSize > 0) {
      let amountAboveMaxSizeStr = (sendMaxInfo.amountAboveMaxSize / 1e8);
      warningMsg.push("A total of " + amountAboveMaxSizeStr + " " + this.tx.coin.toUpperCase() + " were excluded. The maximum size allowed for a transaction was exceeded.");// TODO gettextCatalog
    }
    return warningMsg.join('\n');
  };

  private getTxp(tx: any, wallet: any, dryRun: boolean): Promise<any> {
    return new Promise((resolve, reject) => {

      // ToDo: use a credential's (or fc's) function for this
      if (tx.description && !wallet.credentials.sharedEncryptingKey) {
        let msg = 'Could not add message to imported wallet without shared encrypting key'; // TODO gettextCatalog
        this.logger.warn(msg);
        this.setSendError(msg);
        return reject(msg);
      }

      if (tx.amount > Number.MAX_SAFE_INTEGER) {
        let msg = 'Amount too big'; // TODO gettextCatalog
        this.logger.warn(msg);
        this.setSendError(msg);
        return reject(msg);
      }

      let txp: any = {};

      txp.outputs = [{
        'toAddress': tx.toAddress,
        'amount': tx.amount,
        'message': tx.description
      }];

      if (tx.sendMaxInfo) {
        txp.inputs = tx.sendMaxInfo.inputs;
        txp.fee = tx.sendMaxInfo.fee;
      } else {
        if (this.usingCustomFee) {
          txp.feePerKb = tx.feeRate;
        } else txp.feeLevel = tx.feeLevel;
      }

      txp.message = tx.description;

      if (tx.paypro) {
        txp.payProUrl = tx.paypro.url;
      }
      txp.excludeUnconfirmedUtxos = !tx.spendUnconfirmed;
      txp.dryRun = dryRun;

      this.walletProvider.createTx(wallet, txp).then((ctxp: any) => {
        return resolve(ctxp);
      }).catch((err: any) => {
        this.setSendError(err);
        return reject(err);
      });
    });
  }

  private setSendError(msg: string) {
    this.popupProvider.ionicAlert('Error at confirm', this.bwcErrorProvider.msg(msg)); // TODO gettextCatalog
  }

  public toggleAddress(): void {
    this.showAddress = !this.showAddress;
  }

  public onWalletSelect(wallet: any): void {
    this.setWallet(wallet);
  }

  public showDescriptionPopup(tx) {
    let message = 'Add description'; // TODO gettextCatalog
    let opts = {
      defaultText: tx.description
    };
    this.popupProvider.ionicPrompt(null, message, opts).then((res: string) => {
      if (res) {
        tx.description = res;
      }
    });
  };

  public approve(tx: any, wallet: any): void {
    if (!tx || !wallet) return;

    if (this.paymentExpired) {
      this.popupProvider.ionicAlert(null, 'This bitcoin payment request has expired.'); // TODO gettextCatalog
      return;
    }

    this.onGoingProcessProvider.set('creatingTx', true);
    this.getTxp(_.clone(tx), wallet, false).then((txp: any) => {
      this.onGoingProcessProvider.set('creatingTx', false);

      // confirm txs for more that 20usd, if not spending/touchid is enabled
      let confirmTx = (): Promise<any> => {
        return new Promise((resolve, reject) => {
          if (this.walletProvider.isEncrypted(wallet))
            return resolve();

          this.txFormatProvider.formatToUSD(wallet.coin, txp.amount).then((val) => {
            let amountUsd = parseFloat(val);
            if (amountUsd <= this.CONFIRM_LIMIT_USD)
              return resolve();

            let amount = (this.tx.amount / 1e8).toFixed(8);
            let unit = this.config.wallet.settings.unitName;
            let name = wallet.name;
            let message = 'Sending ' + amount + ' ' + unit + ' from your ' + name + ' wallet'; // TODO gettextCatalog
            let okText = 'Confirm'; // TODO gettextCatalog
            let cancelText = 'Cancel'; // TODO gettextCatalog
            this.popupProvider.ionicConfirm(null, message, okText, cancelText).then((ok: boolean) => {
              return resolve(!ok);
            });
          });
        });
      };

      let publishAndSign = (): void => {
        if (!wallet.canSign() && !wallet.isPrivKeyExternal()) {
          this.logger.info('No signing proposal: No private key');
          this.walletProvider.onlyPublish(wallet, txp).catch((err: any) => {
            this.setSendError(err);
          });
          this.openSuccessModal();
          return;
        }

        this.walletProvider.publishAndSign(wallet, txp).then((txp: any) => {
          if (this.config.confirmedTxsNotifications && this.config.confirmedTxsNotifications.enabled) {
            this.txConfirmNotificationProvider.subscribe(wallet, {
              txid: txp.txid
            });
          }
          this.openSuccessModal();
        }).catch((err: any) => {
          this.setSendError(err);
          return;
        });
      };

      confirmTx().then((nok: boolean) => {
        if (nok) {
          return;
        }
        publishAndSign();
      }).catch((err: any) => {
        this.logger.warn(err);
        return;
      });
    }).catch((err: any) => {
      this.logger.warn(err);
      return;
    });
  }

  public openSuccessModal() {
    let modal = this.modalCtrl.create(SuccessModalPage, {}, { showBackdrop: true, enableBackdropDismiss: false });
    modal.present();
    modal.onDidDismiss(() => {
      this.navCtrl.popToRoot();
      this.navCtrl.parent.select(0);
    })
  }

  public openPPModal(): void {
    this.modalCtrl.create(PayProPage, {}, {
      showBackdrop: true,
      enableBackdropDismiss: true,
    });
  };

  public chooseFeeLevel(): void {

    if (this.tx.coin == 'bch') return;

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
      enableBackdropDismiss: false,
    });

    myModal.present();

    myModal.onDidDismiss((data: any) => {

      this.logger.debug('New fee level choosen:' + data.newFeeLevel + ' was:' + this.tx.feeLevel);
      this.usingCustomFee = data.newFeeLevel == 'custom' ? true : false;

      if (this.tx.feeLevel == data.newFeeLevel && !this.usingCustomFee) {
        return;
      }

      this.tx.feeLevel = data.newFeeLevel;
      this.tx.feeLevelName = this.feeProvider.feeOpts[this.tx.feeLevel];
      if (this.usingCustomFee) this.tx.feeRate = parseInt(data.customFeePerKB);

      this.updateTx(this.tx, this.wallet, { clearCache: true, dryRun: true }).catch((err: any) => {
        this.logger.warn(err);
      });
    });
  };

  public showWallets(): void {
    let id = this.wallet ? this.wallet.credentials.walletId : null;
    this.events.publish('showWalletsSelectorEvent', this.wallets, id, this.walletSelectorTitle);
    this.events.subscribe('selectWalletEvent', (wallet: any) => {
      if (!_.isEmpty(wallet)) this.onWalletSelect(wallet);
      this.events.unsubscribe('selectWalletEvent');
    });
  }

}
