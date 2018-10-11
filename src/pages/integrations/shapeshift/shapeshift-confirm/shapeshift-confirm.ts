import { Component, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ModalController, NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Logger } from '../../../../providers/logger/logger';

// Pages
import { FinishModalPage } from '../../../finish/finish';
import { ShapeshiftPage } from '../shapeshift';

// Providers
import { BwcErrorProvider } from '../../../../providers/bwc-error/bwc-error';
import { BwcProvider } from '../../../../providers/bwc/bwc';
import { ConfigProvider } from '../../../../providers/config/config';
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { FeeProvider } from '../../../../providers/fee/fee';
import { OnGoingProcessProvider } from '../../../../providers/on-going-process/on-going-process';
import { PlatformProvider } from '../../../../providers/platform/platform';
import { PopupProvider } from '../../../../providers/popup/popup';
import { ProfileProvider } from '../../../../providers/profile/profile';
import { ReplaceParametersProvider } from '../../../../providers/replace-parameters/replace-parameters';
import { ShapeshiftProvider } from '../../../../providers/shapeshift/shapeshift';
import { TxFormatProvider } from '../../../../providers/tx-format/tx-format';
import {
  TransactionProposal,
  WalletProvider
} from '../../../../providers/wallet/wallet';

@Component({
  selector: 'page-shapeshift-confirm',
  templateUrl: 'shapeshift-confirm.html'
})
export class ShapeshiftConfirmPage {
  @ViewChild('slideButton')
  slideButton;

  private amount: number;
  private rateUnit: number;
  private fromWalletId: string;
  private toWalletId: string;
  private createdTx;
  private message: string;
  private configWallet;
  private bitcore;
  private bitcoreCash;
  private useSendMax: boolean;
  private sendMaxInfo;
  private accessToken: string;

  public currency: string;
  public currencyIsoCode: string;
  public isCordova: boolean;
  public toWallet;
  public fromWallet;
  public fiatWithdrawal: number;
  public fiatAmount: number;
  public fiatFee: number;
  public fiatTotalAmount: number;
  public shapeInfo;
  public feeRatePerStr: string;
  public amountStr: string;
  public withdrawalStr: string;
  public feeStr: string;
  public totalAmountStr: string;
  public txSent;
  public network: string;
  public hideSlideButton: boolean;

  constructor(
    private bwcProvider: BwcProvider,
    private bwcErrorProvider: BwcErrorProvider,
    private configProvider: ConfigProvider,
    private replaceParametersProvider: ReplaceParametersProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private logger: Logger,
    private navCtrl: NavController,
    private navParams: NavParams,
    private platformProvider: PlatformProvider,
    private popupProvider: PopupProvider,
    private profileProvider: ProfileProvider,
    private shapeshiftProvider: ShapeshiftProvider,
    private txFormatProvider: TxFormatProvider,
    private walletProvider: WalletProvider,
    private modalCtrl: ModalController,
    private translate: TranslateService,
    private feeProvider: FeeProvider
  ) {
    this.configWallet = this.configProvider.get().wallet;
    this.currencyIsoCode = 'USD'; // Only USD
    this.isCordova = this.platformProvider.isCordova;
    this.bitcore = this.bwcProvider.getBitcore();
    this.bitcoreCash = this.bwcProvider.getBitcoreCash();

    this.useSendMax = this.navParams.data.useSendMax ? true : false;

    this.amount = this.navParams.data.amount;
    this.currency = this.navParams.data.currency;
    this.fromWalletId = this.navParams.data.id;
    this.toWalletId = this.navParams.data.toWalletId;

    this.network = this.shapeshiftProvider.getNetwork();
    this.fromWallet = this.profileProvider.getWallet(this.fromWalletId);
    this.toWallet = this.profileProvider.getWallet(this.toWalletId);
  }

  ionViewDidEnter() {
    if (_.isEmpty(this.fromWallet) || _.isEmpty(this.toWallet)) {
      this.showErrorAndBack(null, this.translate.instant('No wallet found'));
      return;
    }

    this.shapeshiftProvider.getLimit(this.getCoinPair(), (_, lim) => {
      let min = Number(lim.min);
      let max = Number(lim.limit);

      if (this.useSendMax) {
        this.onGoingProcessProvider.set('calculatingSendMax');
        this.setMaxInfo(max, min)
          .then(() => {
            this.onGoingProcessProvider.clear();
            this.createShift();
          })
          .catch(err => {
            this.onGoingProcessProvider.clear();
            this.logger.error(err);
            this.showErrorAndBack(null, err);
          });
      } else {
        let amountNumber = Number(this.amount);
        if (this.isMinimum(amountNumber, min)) return;
        if (this.isMaximum(amountNumber, max)) return;
        this.createShift();
      }
    });
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: ShapeshiftConfirmPage');
  }

  ionViewWillLeave() {
    this.navCtrl.swipeBackEnabled = true;
  }

  ionViewWillEnter() {
    this.navCtrl.swipeBackEnabled = false;
  }

  private isMaximum(amount: number, max: number): boolean {
    if (amount > max) {
      let message = this.replaceParametersProvider.replace(
        this.translate.instant('Maximum amount allowed is {{max}}'),
        { max }
      );
      this.showErrorAndBack(null, message);
      return true;
    }
    return false;
  }

  private isMinimum(amount: number, min: number): boolean {
    if (amount < min) {
      let message = this.replaceParametersProvider.replace(
        this.translate.instant('Minimum amount required is {{min}}'),
        { min }
      );
      this.showErrorAndBack(null, message);
      return true;
    }
    return false;
  }

  private setMaxInfo(max: number, min: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getSendMaxInfo()
        .then(sendMaxInfo => {
          if (sendMaxInfo) {
            this.logger.debug('Send max info', sendMaxInfo);

            if (sendMaxInfo.amount == 0) {
              let msg = this.translate.instant('Not enough funds for fee');
              return reject(msg);
            }

            this.sendMaxInfo = sendMaxInfo;
            this.amount = sendMaxInfo.amount;

            let maxSat = parseInt(
              (max * this.configWallet.settings.unitToSatoshi).toFixed(0),
              10
            );
            let minSat = parseInt(
              (min * this.configWallet.settings.unitToSatoshi).toFixed(0),
              10
            );
            if (this.amount > maxSat) {
              this.popupProvider
                .ionicAlert(
                  this.translate.instant('ShapeShift max limit reached'),
                  'Maximum amount allowed is ' + max
                )
                .then(() => {
                  this.amount = max;
                  this.useSendMax = false;
                  return resolve();
                });
            } else if (this.amount < minSat) {
              let err = this.replaceParametersProvider.replace(
                this.translate.instant(
                  'ShapeShift requires a minimum value of {{min}}'
                ),
                { min }
              );
              return reject(err);
            } else {
              this.showSendMaxWarning().then(() => {
                return resolve();
              });
            }
          }
        })
        .catch(err => {
          this.logger.error('ShapeShift: could not get SendMax info', err);
          let msg = this.translate.instant('Error getting SendMax information');
          return reject(msg);
        });
    });
  }

  private getSendMaxInfo(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.feeProvider
        .getFeeRate(
          this.fromWallet.coin,
          this.network,
          this.configWallet.settings.feeLevel || 'normal'
        )
        .then(feeRate => {
          this.onGoingProcessProvider.set('retrievingInputs');
          this.walletProvider
            .getSendMaxInfo(this.fromWallet, {
              feePerKb: feeRate,
              excludeUnconfirmedUtxos: !this.configWallet.spendUnconfirmed,
              returnInputs: true
            })
            .then(res => {
              this.onGoingProcessProvider.clear();
              return resolve(res);
            })
            .catch(err => {
              this.onGoingProcessProvider.clear();
              return reject(err);
            });
        });
    });
  }

  public openExternalLink(url: string) {
    this.externalLinkProvider.open(url);
  }

  private showErrorAndBack(title: string, msg) {
    this.hideSlideButton = false;
    if (this.isCordova) this.slideButton.isConfirmed(false);
    title = title ? title : this.translate.instant('Error');
    this.logger.error(msg);
    msg = msg && msg.errors ? msg.errors[0].message : msg;
    this.popupProvider.ionicAlert(title, msg).then(() => {
      this.navCtrl.pop();
    });
  }

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

  private satToFiat(coin: string, sat: number, isoCode: string): Promise<any> {
    return new Promise(resolve => {
      this.txFormatProvider.toFiat(coin, sat, isoCode).then(value => {
        return resolve(value);
      });
    });
  }

  private setFiatTotalAmount(
    amountSat: number,
    feeSat: number,
    withdrawalSat: number
  ) {
    this.satToFiat(
      this.toWallet.coin,
      withdrawalSat,
      this.currencyIsoCode
    ).then(w => {
      this.fiatWithdrawal = Number(w);
      this.satToFiat(
        this.fromWallet.coin,
        amountSat,
        this.currencyIsoCode
      ).then(a => {
        this.fiatAmount = Number(a);
        this.satToFiat(this.fromWallet.coin, feeSat, this.currencyIsoCode).then(
          i => {
            this.fiatFee = Number(i);
            this.fiatTotalAmount = this.fiatAmount + this.fiatFee;
          }
        );
      });
    });
  }

  private saveShapeshiftData(): void {
    let address = this.shapeInfo.deposit;
    let withdrawal = this.shapeInfo.withdrawal;
    let now = moment().unix() * 1000;

    this.shapeshiftProvider.getStatus(address, this.accessToken, (_, st) => {
      let newData = {
        address,
        withdrawal,
        date: now,
        amount: this.amountStr,
        rate:
          this.rateUnit +
          ' ' +
          this.toWallet.coin.toUpperCase() +
          ' per ' +
          this.fromWallet.coin.toUpperCase(),
        title:
          this.fromWallet.coin.toUpperCase() +
          ' to ' +
          this.toWallet.coin.toUpperCase(),
        // From ShapeShift
        status: st.status,
        transaction: st.transaction || null, // Transaction ID of coin sent to withdrawal address
        incomingCoin: st.incomingCoin || null, // Amount deposited
        incomingType: st.incomingType || null, // Coin type of deposit
        outgoingCoin: st.outgoingCoin || null, // Amount sent to withdrawal address
        outgoingType: st.outgoingType || null // Coin type of withdrawal
      };

      this.shapeshiftProvider.saveShapeshift(newData, null, () => {
        this.logger.debug('Saved shift with status: ' + newData.status);
        this.openFinishModal();
      });
    });
  }

  private createTx(wallet, toAddress: string): Promise<any> {
    return new Promise((resolve, reject) => {
      let amount = this.useSendMax
        ? this.amount
        : parseInt(
            (this.amount * this.configWallet.settings.unitToSatoshi).toFixed(0),
            10
          );

      this.message =
        this.fromWallet.coin.toUpperCase() +
        ' to ' +
        this.toWallet.coin.toUpperCase();
      let outputs = [];

      outputs.push({
        toAddress,
        amount,
        message: this.message
      });

      let txp: Partial<TransactionProposal> = {
        toAddress,
        amount,
        outputs,
        message: this.message,
        excludeUnconfirmedUtxos: this.configWallet.spendUnconfirmed
          ? false
          : true,
        customData: {
          shapeShift: toAddress,
          service: 'shapeshift'
        }
      };

      if (this.sendMaxInfo) {
        txp.inputs = this.sendMaxInfo.inputs;
        txp.fee = this.sendMaxInfo.fee;
      } else {
        txp.feeLevel = this.configWallet.settings.feeLevel || 'normal';
      }

      this.walletProvider
        .createTx(wallet, txp)
        .then(ctxp => {
          return resolve(ctxp);
        })
        .catch(err => {
          this.hideSlideButton = false;
          return reject({
            title: this.translate.instant('Could not create transaction'),
            message: this.bwcErrorProvider.msg(err)
          });
        });
    });
  }

  private showSendMaxWarning(): Promise<any> {
    return new Promise(resolve => {
      let fee = this.sendMaxInfo.fee / 1e8;
      let msg = this.replaceParametersProvider.replace(
        this.translate.instant(
          '{{fee}} {{coin}} will be deducted for bitcoin networking fees.'
        ),
        { fee, coin: this.fromWallet.coin.toUpperCase() }
      );
      let warningMsg = this.verifyExcludedUtxos();

      if (!_.isEmpty(warningMsg)) msg += '\n' + warningMsg;

      this.popupProvider.ionicAlert(null, msg).then(() => {
        resolve();
      });
    });
  }

  private verifyExcludedUtxos() {
    let warningMsg = [];
    if (this.sendMaxInfo.utxosBelowFee > 0) {
      let amountBelowFeeStr = this.sendMaxInfo.amountBelowFee / 1e8;
      let message = this.replaceParametersProvider.replace(
        this.translate.instant(
          'A total of {{fee}} {{coin}} were excluded. These funds come from UTXOs smaller than the network fee provided.'
        ),
        { fee: amountBelowFeeStr, coin: this.fromWallet.coin.toUpperCase() }
      );
      warningMsg.push(message);
    }

    if (this.sendMaxInfo.utxosAboveMaxSize > 0) {
      let amountAboveMaxSizeStr = this.sendMaxInfo.amountAboveMaxSize / 1e8;
      let message = this.replaceParametersProvider.replace(
        this.translate.instant(
          'A total of {{fee}} {{coin}} were excluded. The maximum size allowed for a transaction was exceeded.'
        ),
        { fee: amountAboveMaxSizeStr, coin: this.fromWallet.coin.toUpperCase() }
      );
      warningMsg.push(message);
    }
    return warningMsg.join('\n');
  }

  private getLegacyAddressFormat(addr: string, coin: string): string {
    if (coin == 'btc') return addr;
    let a = this.bitcoreCash.Address(addr).toObject();
    return this.bitcore.Address.fromObject(a).toString();
  }

  private getNewAddressFormat(addr: string, coin: string): string {
    if (coin == 'btc') return addr;
    let a = this.bitcore.Address(addr).toObject();
    return this.bitcoreCash.Address.fromObject(a).toString();
  }

  private getCoinPair(): string {
    return this.fromWallet.coin + '_' + this.toWallet.coin;
  }

  private createShift(): void {
    this.onGoingProcessProvider.set('connectingShapeshift');
    this.shapeshiftProvider.init((err, res) => {
      if (err) {
        this.onGoingProcessProvider.clear();
        this.showErrorAndBack(null, err.error.error_description);
        return;
      }
      this.accessToken = res.accessToken;

      this.walletProvider
        .getAddress(this.toWallet, false)
        .then((withdrawalAddress: string) => {
          withdrawalAddress = this.getLegacyAddressFormat(
            withdrawalAddress,
            this.toWallet.coin
          );

          this.walletProvider
            .getAddress(this.fromWallet, false)
            .then((returnAddress: string) => {
              returnAddress = this.getLegacyAddressFormat(
                returnAddress,
                this.fromWallet.coin
              );

              let data = {
                withdrawal: withdrawalAddress,
                pair: this.getCoinPair(),
                returnAddress,
                token: this.accessToken
              };
              this.shapeshiftProvider.shift(data, (err, shapeData) => {
                if (err || shapeData.error) {
                  this.onGoingProcessProvider.clear();
                  this.showErrorAndBack(null, err || shapeData.error);
                  return;
                }

                let toAddress = this.getNewAddressFormat(
                  shapeData.deposit,
                  this.fromWallet.coin
                );

                this.createTx(this.fromWallet, toAddress)
                  .then(ctxp => {
                    // Save in memory
                    this.createdTx = ctxp;
                    this.shapeInfo = shapeData;

                    this.shapeshiftProvider.getRate(
                      this.getCoinPair(),
                      (_, r) => {
                        this.onGoingProcessProvider.clear();
                        this.rateUnit = r.rate;
                        let amountUnit = this.txFormatProvider.satToUnit(
                          ctxp.amount
                        );
                        let withdrawalSat = Number(
                          (this.rateUnit * amountUnit * 100000000).toFixed()
                        );

                        // Fee rate
                        let per = (ctxp.fee / (ctxp.amount + ctxp.fee)) * 100;
                        this.feeRatePerStr = per.toFixed(2) + '%';

                        // Amount + Unit
                        this.amountStr = this.txFormatProvider.formatAmountStr(
                          this.fromWallet.coin,
                          ctxp.amount
                        );
                        this.withdrawalStr = this.txFormatProvider.formatAmountStr(
                          this.toWallet.coin,
                          withdrawalSat
                        );
                        this.feeStr = this.txFormatProvider.formatAmountStr(
                          this.fromWallet.coin,
                          ctxp.fee
                        );
                        this.totalAmountStr = this.txFormatProvider.formatAmountStr(
                          this.fromWallet.coin,
                          ctxp.amount + ctxp.fee
                        );

                        // Convert to fiat
                        this.setFiatTotalAmount(
                          ctxp.amount,
                          ctxp.fee,
                          withdrawalSat
                        );
                      }
                    );
                  })
                  .catch(err => {
                    this.onGoingProcessProvider.clear();
                    this.showErrorAndBack(err.title, err.message);
                    return;
                  });
              });
            })
            .catch(() => {
              this.onGoingProcessProvider.clear();
              this.showErrorAndBack(null, 'Could not get address');
              return;
            });
        })
        .catch(() => {
          this.onGoingProcessProvider.clear();
          this.showErrorAndBack(null, 'Could not get address');
          return;
        });
    });
  }

  public confirmTx(): void {
    if (!this.createdTx) {
      this.showErrorAndBack(
        null,
        this.translate.instant('Transaction has not been created')
      );
      return;
    }
    this.hideSlideButton = true;
    let fromCoin = this.fromWallet.coin.toUpperCase();
    let toCoin = this.toWallet.coin.toUpperCase();
    let title = this.replaceParametersProvider.replace(
      this.translate.instant('Confirm to shift {{fromCoin}} to {{toCoin}}'),
      { fromCoin, toCoin }
    );

    let okText = this.translate.instant('OK');
    let cancelText = this.translate.instant('Cancel');
    this.popupProvider.ionicConfirm(title, '', okText, cancelText).then(ok => {
      if (!ok) {
        if (this.isCordova) this.slideButton.isConfirmed(false);
        this.hideSlideButton = false;
        return;
      }

      this.publishAndSign(this.fromWallet, this.createdTx)
        .then(txSent => {
          this.txSent = txSent;
          this.saveShapeshiftData();
        })
        .catch(err => {
          this.logger.error(this.bwcErrorProvider.msg(err));
          this.showErrorAndBack(
            null,
            this.translate.instant('Could not send transaction')
          );
          return;
        });
    });
  }

  private openFinishModal(): void {
    let finishText = 'Transaction Sent';
    let modal = this.modalCtrl.create(
      FinishModalPage,
      { finishText },
      { showBackdrop: true, enableBackdropDismiss: false }
    );
    modal.present();
    modal.onDidDismiss(async () => {
      await this.navCtrl.popToRoot({ animate: false });
      await this.navCtrl.push(ShapeshiftPage, null, { animate: false });
    });
  }

  public cancel(): void {
    this.navCtrl.popToRoot({ animate: false });
  }
}
