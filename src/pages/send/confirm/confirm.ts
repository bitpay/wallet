import { Component } from '@angular/core';
import { NavController, NavParams, ModalController } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';
import * as _ from 'lodash';

// Pages
import { SendPage } from '../../send/send';
import { HomePage } from '../../home/home';
import { PayProPage } from '../../paypro/paypro';
import { ChooseFeeLevelPage } from '../../choose-fee-level/choose-fee-level';

// Providers
import { ConfigProvider } from '../../../providers/config/config';
import { PlatformProvider } from '../../../providers/platform/platform';
import { ProfileProvider } from '../../../providers/profile/profile';
import { WalletProvider } from '../../../providers/wallet/wallet';
import { BwcProvider } from '../../../providers/bwc/bwc';
import { PopupProvider } from '../../../providers/popup/popup';
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';
import { BwcErrorProvider } from '../../../providers/bwc-error/bwc-error';
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { TxFormatProvider } from '../../../providers/tx-format/tx-format';
import { FeeProvider } from '../../../providers/fee/fee';
import { TxConfirmNotificationProvider } from '../../../providers/tx-confirm-notification/tx-confirm-notification';

@Component({
  selector: 'page-confirm',
  templateUrl: 'confirm.html',
})
export class ConfirmPage {

  public data: any;
  public toAddress: string;
  public amount: string;
  public coin: string;
  public recipientType: string;

  public countDown = null;
  public CONFIRM_LIMIT_USD: number = 20;
  public FEE_TOO_HIGH_LIMIT_PER: number = 15;

  public tx: any = {};
  public wallet: any;
  public wallets: any;
  public noWalletMessage: string;
  public criticalError: boolean;
  public showAddress: boolean;
  public walletSelectorTitle: string;
  public walletSelector: boolean;
  public buttonText: string;
  public paymentExpired: boolean;
  public remainingTimeStr: string;
  public sendStatus: string;
  public showFee: boolean;

  // Config Related values
  public config: any;
  public walletConfig: any;
  public unitToSatoshi: number;
  public unitDecimals: number;
  public satToUnit: number;
  public configFeeLevel: string;


  // Platform info
  public isCordova: boolean = this.platformProvider.isCordova;
  public isWindowsPhoneApp = this.platformProvider.isCordova && this.platformProvider.isWP;

  //custom fee flag
  public usingCustomFee: boolean = false;

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private logger: Logger,
    private configProvider: ConfigProvider,
    private platformProvider: PlatformProvider,
    private profileProvider: ProfileProvider,
    private walletProvider: WalletProvider,
    private bwcProvider: BwcProvider,
    private popupProvider: PopupProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private bwcErrorProvider: BwcErrorProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private txFormatProvider: TxFormatProvider,
    private feeProvider: FeeProvider,
    private txConfirmNotificationProvider: TxConfirmNotificationProvider,
    private modalCtrl: ModalController
  ) {
    this.config = this.configProvider.get();
    this.walletConfig = this.config.wallet;
    this.unitToSatoshi = this.walletConfig.settings.unitToSatoshi;
    this.unitDecimals = this.walletConfig.settings.unitDecimals;
    this.satToUnit = 1 / this.unitToSatoshi;
    this.configFeeLevel = this.walletConfig.settings.feeLevel ? this.walletConfig.settings.feeLevel : 'normal';
    this.showFee = false;
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ConfirmPage');
    this.data = this.navParams.data;
    this.toAddress = this.navParams.data.toAddress;
    this.amount = this.navParams.data.amount;
    this.coin = this.navParams.data.coin;
    this.recipientType = this.navParams.data.recipientType;
  }

  ionViewDidEnter() {
    // Setup
    let B = this.coin == 'bch' ? this.bwcProvider.getBitcoreCash() : this.bwcProvider.getBitcore();
    let networkName;
    try {
      networkName = (new B.Address(this.toAddress)).network.name;
    } catch (e) {
      let message = 'Copay only supports Bitcoin Cash using new version numbers addresses'; // TODO gettextCatalog
      let backText = 'Go back'; // TODO gettextCatalog
      let learnText = 'Learn more'; // TODO gettextCatalog
      this.popupProvider.ionicConfirm(null, message, backText, learnText).then((res: boolean) => {
        this.navCtrl.setRoot(SendPage);
        this.navCtrl.popToRoot();
        if (!res) {
          let url = 'https://support.bitpay.com/hc/en-us/articles/115004671663';
          this.externalLinkProvider.open(url);
        }
      });
      return;
    }

    // Grab stateParams
    let tx: any = {
      amount: parseFloat(this.navParams.data.amount) * 100000000, // TODO review this line '* 100000000' convert satoshi to BTC
      sendMax: this.navParams.data.useSendMax == 'true' ? true : false,
      toAddress: this.navParams.data.toAddress,
      description: this.navParams.data.description,
      paypro: this.navParams.data.paypro,

      feeLevel: this.configFeeLevel,
      spendUnconfirmed: this.walletConfig.spendUnconfirmed,

      // Vanity tx info (not in the real tx)
      recipientType: this.navParams.data.recipientType || null,
      name: this.navParams.data.name,
      email: this.navParams.data.email,
      color: this.navParams.data.color,
      network: networkName,
      coin: this.navParams.data.coin,
      txp: {},
    };

    this.tx = tx;

    if (tx.coin && tx.coin == 'bch') tx.feeLevel = 'normal';

    this.showAddress = false;

    this.walletSelectorTitle = 'Send from'; // TODO gettextCatalog

    this.setWalletSelector(tx.coin, tx.network, tx.amount).then(() => {
      if (this.wallets.length > 1) {
        this.showWalletSelector();
      } else if (this.wallets.length) {
        this.setWallet(this.wallets[0], tx);
      }
    }).catch((err: any) => {
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

          if (!status.availableBalanceSat)
            this.logger.debug('No balance available in: ' + wallet.name);

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
    this.logger.warn('Not ready to make the payment:' + msg);
  };

  private exitWithError(err: any) {
    this.logger.info('Error setting wallet selector:' + err);
    this.popupProvider.ionicAlert("", this.bwcErrorProvider.msg(err)).then(() => { // TODO gettextCatalog
      this.navCtrl.setRoot(SendPage);
      this.navCtrl.popToRoot();
    });
  };

  private showWalletSelector(): void {
    this.walletSelector = true;
  };

  /* sets a wallet on the UI, creates a TXPs for that wallet */

  private setWallet(wallet: any, tx: any): void {
    this.wallet = wallet;

    // If select another wallet
    tx.coin = wallet.coin;
    tx.feeLevel = wallet.coin == 'bch' ? 'normal' : this.configFeeLevel;
    this.usingCustomFee = null;

    this.setButtonText(wallet.credentials.m > 1, !!tx.paypro);

    if (tx.paypro)
      this.paymentTimeControl(tx.paypro.expires);

    this.updateTx(tx, wallet, { dryRun: true }).catch((err: any) => {
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

      this.onGoingProcessProvider.set('calculatingFee', true);

      if (opts.clearCache) {
        tx.txp = {};
      }

      this.tx = tx;
      let updateAmount = (): void => {
        if (!tx.amount) return;

        // Amount
        tx.amountStr = this.txFormatProvider.formatAmountStr(wallet.coin, tx.amount);
        tx.amountValueStr = tx.amountStr.split(' ')[0];
        tx.amountUnitStr = tx.amountStr.split(' ')[1];
        this.txFormatProvider.formatAlternativeStr(wallet.coin, tx.amount).then((v: string) => {
          tx.alternativeAmountStr = v;
        });
      }

      updateAmount();

      // End of quick refresh, before wallet is selected.
      if (!wallet) {
        this.onGoingProcessProvider.set('calculatingFee', false);
        return resolve();
      }

      this.feeProvider.getFeeRate(wallet.coin, tx.network, tx.feeLevel).then((feeRate: any) => {


        if (!this.usingCustomFee) tx.feeRate = feeRate;
        tx.feeLevelName = this.feeProvider.feeOpts[tx.feeLevel];

        this.getSendMaxInfo(_.clone(tx), wallet).then((sendMaxInfo: any) => {

          if (sendMaxInfo) {

            this.logger.debug('Send max info', sendMaxInfo);

            if (tx.sendMax && sendMaxInfo.amount == 0) {
              this.onGoingProcessProvider.set('calculatingFee', false);
              this.setNoWallet('Insufficient funds'); // TODO gettextCatalog
              this.popupProvider.ionicAlert('Error', 'Not enough funds for fee').then(() => {
                return resolve('no_funds');
              }); // TODO gettextCatalog
            }

            tx.sendMaxInfo = sendMaxInfo;
            tx.amount = tx.sendMaxInfo.amount;
            updateAmount();
            this.onGoingProcessProvider.set('calculatingFee', false);
            setTimeout(() => {
              this.showSendMaxWarning(wallet, sendMaxInfo);
            }, 200);
          }

          // txp already generated for this wallet?
          if (tx.txp[wallet.id]) {
            this.onGoingProcessProvider.set('calculatingFee', false);
            return resolve();
          }

          this.getTxp(_.clone(tx), wallet, opts.dryRun).then((txp: any) => {
            this.onGoingProcessProvider.set('calculatingFee', false);
            txp.feeStr = this.txFormatProvider.formatAmountStr(wallet.coin, txp.fee);
            this.txFormatProvider.formatAlternativeStr(wallet.coin, txp.fee).then((value: string) => {
              txp.alternativeFeeStr = value;
            });

            let per = (txp.fee / (txp.amount + txp.fee) * 100);
            txp.feeRatePerStr = per.toFixed(2) + '%';
            txp.feeToHigh = per > this.FEE_TOO_HIGH_LIMIT_PER;

            tx.txp[wallet.id] = txp;
            this.tx = tx;
            this.logger.debug('Confirm. TX Fully Updated for wallet:' + wallet.id, tx);
            this.showFee = true;
            return resolve();
          }).catch((err: any) => {
            return reject(err);
          });
        }).catch((err: any) => {
          this.onGoingProcessProvider.set('calculatingFee', false);
          let msg = 'Error getting SendMax information'; // TODO gettextCatalog
          this.setSendError(msg);
          return reject();
        });
      }).catch((err: any) => {
        this.onGoingProcessProvider.set('calculatingFee', false);
        return reject(err);
      });
    });

  }

  private getSendMaxInfo(tx: any, wallet: any): Promise<any> {
    return new Promise((resolve, reject) => {

      if (!tx.sendMax) return resolve();

      //ongoingProcess.set('retrievingInputs', true);
      this.walletProvider.getSendMaxInfo(wallet, {
        feePerKb: tx.feeRate,
        excludeUnconfirmedUtxos: !tx.spendUnconfirmed,
        returnInputs: true,
      }).then((res: any) => {
        resolve(res);
      }).catch((err: any) => {
        console.log(err);
      });
    });
  }

  private showSendMaxWarning(wallet: any, sendMaxInfo: any): void {
    let fee = this.txFormatProvider.formatAmountStr(wallet.coin, sendMaxInfo.fee);
    let msg = fee + " will be deducted for bitcoin networking fees.";
    let warningMsg = this.verifyExcludedUtxos(wallet, sendMaxInfo);

    if (!_.isEmpty(warningMsg))
      msg += '\n' + warningMsg;

    this.popupProvider.ionicAlert(null, msg);
  }

  private verifyExcludedUtxos(wallet: any, sendMaxInfo: any): any {
    let warningMsg = [];
    if (sendMaxInfo.utxosBelowFee > 0) {
      let amountBelowFeeStr = this.txFormatProvider.formatAmountStr(wallet.coin, sendMaxInfo.amountBelowFee);
      warningMsg.push("A total of " + amountBelowFeeStr + " were excluded. These funds come from UTXOs smaller than the network fee provided.");// TODO gettextCatalog
    }

    if (sendMaxInfo.utxosAboveMaxSize > 0) {
      let amountAboveMaxSizeStr = this.txFormatProvider.formatAmountStr(wallet.coin, sendMaxInfo.amountAboveMaxSize);
      warningMsg.push("A total of " + amountAboveMaxSizeStr + " were excluded. The maximum size allowed for a transaction was exceeded.");// TODO gettextCatalog
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
    this.sendStatus = '';
    this.popupProvider.ionicAlert('Error at confirm', this.bwcErrorProvider.msg(msg)); // TODO gettextCatalog
  }

  public toggleAddress(): void {
    this.showAddress = !this.showAddress;
  }

  public onWalletSelect(wallet: any): void {
    this.showFee = false;
    this.setWallet(wallet, this.tx);
    this.walletSelector = false;
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

  public approve(tx: any, wallet: any, onSendStatusChange: Function): void {

    if (!tx || !wallet) return;

    if (this.paymentExpired) {
      this.popupProvider.ionicAlert(null, 'This bitcoin payment request has expired.'); // TODO gettextCatalog
      this.sendStatus = '';
      return;
    }

    this.onGoingProcessProvider.set('creatingTx', true, onSendStatusChange);
    this.getTxp(_.clone(tx), wallet, false).then((txp: any) => {
      this.onGoingProcessProvider.set('creatingTx', false, onSendStatusChange);


      // confirm txs for more that 20usd, if not spending/touchid is enabled
      let confirmTx = (): Promise<any> => {
        return new Promise((resolve, reject) => {
          if (this.walletProvider.isEncrypted(wallet))
            return resolve();

          let amountUsd: number;
          this.txFormatProvider.formatToUSD(wallet.coin, txp.amount).then((value: string) => {
            amountUsd = parseFloat(value);
          });

          if (amountUsd <= this.CONFIRM_LIMIT_USD)
            return resolve();

          let amountStr = tx.amountStr;
          let name = wallet.name;
          let message = 'Sending ' + amountStr + ' from your ' + name + ' wallet'; // TODO gettextCatalog
          let okText = 'Confirm'; // TODO gettextCatalog
          let cancelText = 'Cancel'; // TODO gettextCatalog
          this.popupProvider.ionicConfirm(null, message, okText, cancelText).then((ok: boolean) => {
            return resolve(!ok);
          });
        });
      };

      let publishAndSign = (): void => {
        if (!wallet.canSign() && !wallet.isPrivKeyExternal()) {
          this.logger.info('No signing proposal: No private key');
          this.walletProvider.onlyPublish(wallet, txp, onSendStatusChange).catch((err: any) => {
            this.setSendError(err);
          });
          return;
        }

        this.walletProvider.publishAndSign(wallet, txp, onSendStatusChange).then((txp: any) => {

          if (this.config.confirmedTxsNotifications && this.config.confirmedTxsNotifications.enabled) {
            this.txConfirmNotificationProvider.subscribe(wallet, {
              txid: txp.txid
            });
          }
          this.onSuccessConfirm(); // TODO review this line
        }).catch((err: any) => {
          this.setSendError(err);
          return;
        });
      };

      confirmTx().then((nok: boolean) => {
        if (nok) {
          this.sendStatus = '';
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

  public statusChangeHandler(processName: string, showName: string, isOn: boolean): void {
    this.logger.debug('statusChangeHandler: ', processName, showName, isOn);
    if (
      (
        processName === 'broadcastingTx' ||
        ((processName === 'signingTx') && this.wallet.m > 1) ||
        (processName == 'sendingTx' && !this.wallet.canSign() && !this.wallet.isPrivKeyExternal())
      ) && !isOn) {
      this.sendStatus = 'success';
    } else if (showName) {
      this.sendStatus = showName;
    }
  }

  public onSuccessConfirm(): void {
    this.sendStatus = '';
    this.navCtrl.setRoot(HomePage);
    this.navCtrl.popToRoot();
    this.navCtrl.parent.select(0);
  };

  public openPPModal(): void {
    const myModal = this.modalCtrl.create(PayProPage, {}, {
      showBackdrop: true,
      enableBackdropDismiss: true,
    });
  };

  public chooseFeeLevel(tx: any, wallet: any): void {

    if (wallet.coin == 'bch') return;

    let txObject: any = {};
    txObject.network = tx.network;
    txObject.feeLevel = tx.feeLevel;
    txObject.noSave = true;
    txObject.coin = wallet.coin;

    if (this.usingCustomFee) {
      txObject.customFeePerKB = tx.feeRate;
      txObject.feePerSatByte = tx.feeRate / 1000;
    }

    const myModal = this.modalCtrl.create(ChooseFeeLevelPage, txObject, {
      showBackdrop: true,
      enableBackdropDismiss: true,
    });

    myModal.onDidDismiss((data: any) => {

      this.logger.debug('New fee level choosen:' + data.newFeeLevel + ' was:' + tx.feeLevel);

      this.usingCustomFee = data.newFeeLevel == 'custom' ? true : false;

      if (tx.feeLevel == data.newFeeLevel && !this.usingCustomFee) return;

      tx.feeLevel = data.newFeeLevel;
      if (this.usingCustomFee) tx.feeRate = parseInt(data.customFeePerKB);

      this.updateTx(tx, wallet, { clearCache: true, dryRun: true });
    });
  };

}
