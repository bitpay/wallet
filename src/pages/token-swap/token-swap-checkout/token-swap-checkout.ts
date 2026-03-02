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

// Pages
import { FinishModalPage } from '../../finish/finish';
import { OneInchPage } from '../../integrations/one-inch/one-inch';

// Providers
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { AnalyticsProvider } from '../../../providers/analytics/analytics';
import { BwcErrorProvider } from '../../../providers/bwc-error/bwc-error';
import { BwcProvider } from '../../../providers/bwc/bwc';
import { ConfigProvider } from '../../../providers/config/config';
import { CurrencyProvider } from '../../../providers/currency/currency';
import { Logger } from '../../../providers/logger/logger';
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { OneInchProvider } from '../../../providers/one-inch/one-inch';
import { PlatformProvider } from '../../../providers/platform/platform';
import { ProfileProvider } from '../../../providers/profile/profile';
import { RateProvider } from '../../../providers/rate/rate';
import {
  TransactionProposal,
  WalletProvider
} from '../../../providers/wallet/wallet';

@Component({
  selector: 'page-token-swap-checkout',
  templateUrl: 'token-swap-checkout.html'
})
export class TokenSwapCheckoutPage {
  public isCordova: boolean;
  public fromWalletSelected;
  public toWalletSelected;
  public fromToken;
  public toToken;
  public swapData;
  public amountFrom: number;
  public amountTo: number;
  public alternativeIsoCode: string;
  public useSendMax: boolean;
  public sendMaxInfo;
  public fromTokenBalance;
  public fixedRateId: string;
  public rate: number;
  public fee: number;
  public fiatFee: number;
  public gasPrice: number;
  public gasLimit: number;
  public fiatAmountTo;
  private ctxp;

  public totalExchangeFee: number;
  public exchangeTxId: string;

  public paymentExpired: boolean;
  public remainingTimeStr: string;

  private addressFrom: string;
  private addressTo: string;

  constructor(
    private actionSheetProvider: ActionSheetProvider,
    private analyticsProvider: AnalyticsProvider,
    private logger: Logger,
    private navParams: NavParams,
    private modalCtrl: ModalController,
    private oneInchProvider: OneInchProvider,
    private navCtrl: NavController,
    private platformProvider: PlatformProvider,
    private profileProvider: ProfileProvider,
    private translate: TranslateService,
    private configProvider: ConfigProvider,
    public currencyProvider: CurrencyProvider,
    private rateProvider: RateProvider,
    private walletProvider: WalletProvider,
    private bwcErrorProvider: BwcErrorProvider,
    private bwcProvider: BwcProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private events: Events
  ) {
    this.onGoingProcessProvider.set(
      this.translate.instant('Getting data from the exchange...')
    );
    this.isCordova = this.platformProvider.isCordova;
    this.fromWalletSelected = this.profileProvider.getWallet(
      this.navParams.data.fromWalletSelectedId
    );

    this.toWalletSelected = this.profileProvider.getWallet(
      this.navParams.data.toWalletSelectedId
    );
    this.fromToken = this.navParams.data.fromTokenSelected;
    this.toToken = this.navParams.data.toTokenSelected;
    this.useSendMax = this.navParams.data.useSendMax;
    this.sendMaxInfo = this.navParams.data.sendMaxInfo;
    this.fromTokenBalance = this.navParams.data.fromTokenBalance;
    this.amountFrom = this.navParams.data.amountFrom;
    this.totalExchangeFee =
      (this.amountFrom * this.navParams.data.referrerFee) / 100; // use fee from bws
    this.alternativeIsoCode =
      this.configProvider.get().wallet.settings.alternativeIsoCode || 'USD';
    this.getSwap1inch();
  }

  ionViewWillLeave() {
    this.navCtrl.swipeBackEnabled = true;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: TokenSwapCheckoutPage');
    this.navCtrl.swipeBackEnabled = false;
  }

  private getSwap1inch() {
    this.walletProvider
      .getAddress(this.fromWalletSelected, false)
      .then(fromAddress => {
        this.addressFrom = fromAddress;
        this.walletProvider
          .getAddress(this.toWalletSelected, false)
          .then(toAddress => {
            this.addressTo = toAddress;

            // limit of price slippage you are willing to accept in percentage, may be set with decimals. &slippage=0.5 means 0.5% slippage is acceptable.
            // Low values increase chances that transaction will fail, high values increase chances of front running.  Set values in the range from 0 to 50
            const slippage = 0.5;

            let minUnitAmount;
            if (this.useSendMax && this.fromTokenBalance) {
              minUnitAmount = this.fromTokenBalance;
            } else {
              // workaround to prevent scientific notation
              const _amount: number =
                this.amountFrom * 10 ** this.fromToken.decimals;
              minUnitAmount = _amount.toLocaleString('fullwide', {
                useGrouping: false,
                maximumFractionDigits: 0
              });
            }

            let swapRequestData = {
              fromTokenAddress: this.fromToken.address,
              toTokenAddress: this.toToken.address,
              amount: minUnitAmount, // amount in minimum unit
              fromAddress, // we can use '0x0000000000000000000000000000000000000000' for testing purposes
              slippage: this.navParams.data.slippage
                ? this.navParams.data.slippage
                : slippage,
              destReceiver: toAddress
            };

            this.logger.debug('swapRequestData: ', swapRequestData);

            this.oneInchProvider
              .getSwap1inch(this.fromWalletSelected, swapRequestData)
              .then(data => {
                if (data && data.error) {
                  let msg, title;
                  if (
                    data.message &&
                    _.isString(data.message) &&
                    data.message.includes('cannot estimate')
                  ) {
                    if (this.fromToken.symbol.toLowerCase() == 'eth') {
                      title = this.translate.instant(
                        'Insufficient funds for fee'
                      );
                      msg = this.translate.instant(
                        'You do not have enough funds to pay the fee for this Swap.'
                      );
                    } else {
                      title = this.translate.instant(
                        'Insufficient funds for fee in your ETH linked wallet'
                      );
                      msg = this.translate.instant(
                        'You do not have enough funds in your ETH linked wallet to pay the fee for this Swap.'
                      );
                    }
                  } else {
                    title = '1inch Error';
                    msg = `${data.error}: ${data.message}`;
                  }
                  return this.showErrorAndBack(title, msg);
                }
                this.swapData = data;
                this.gasLimit = Math.ceil(Number(this.swapData.tx.gas) * 1.25); // Estimated amount of the gas limit, increase this value by 25%
                this.gasPrice = Number(this.swapData.tx.gasPrice);
                this.fee = this.gasLimit * this.gasPrice;
                this.fiatFee = this.rateProvider.toFiat(
                  this.fee,
                  this.alternativeIsoCode,
                  'eth'
                );
                this.amountTo =
                  Number(this.swapData.toTokenAmount) /
                  10 ** this.toToken.decimals; // amount in minimum unit

                if (!this.toToken.isCustomToken) {
                  this.fiatAmountTo = this.rateProvider.toFiat(
                    Number(this.amountTo) *
                      this.currencyProvider.getPrecision(
                        this.toWalletSelected.coin
                      ).unitToSatoshi,
                    this.alternativeIsoCode,
                    this.toWalletSelected.coin
                  );
                }
                this.paymentTimeControl(5);
                this.onGoingProcessProvider.clear();
              })
              .catch(err => {
                this.logger.error('1Inch getSwap1inch Error: ', err);
                this.showErrorAndBack(
                  null,
                  this.translate.instant(
                    '1Inch is not available at this moment. Please, try again later.'
                  )
                );
              });
          })
          .catch(err => {
            this.logger.error('Could not get toAddress address', err);
            this.showErrorAndBack(
              null,
              this.translate.instant(
                'There was a problem retrieving the address. Please, try again later.'
              )
            );
            return;
          });
      })
      .catch(err => {
        this.logger.error('Could not get fromAddress address', err);
        this.showErrorAndBack(
          null,
          this.translate.instant(
            'There was a problem retrieving the address. Please, try again later.'
          )
        );
        return;
      });
  }

  private createAndBindTokenWallet() {
    if (_.isEmpty(this.toWalletSelected) || _.isEmpty(this.toToken)) return;
    const tokenSymbol = this.toToken.symbol.toLowerCase();
    if (
      tokenSymbol != 'eth' &&
      this.toWalletSelected.coin == 'eth' &&
      tokenSymbol != this.toWalletSelected.coin &&
      this.currencyProvider.isCustomERCToken(tokenSymbol)
    ) {
      const customToken = {
        keyId: this.toWalletSelected.keyId,
        name: this.toToken.name,
        address: this.toToken.address,
        logoURI: this.toToken.logoURI,
        symbol: tokenSymbol,
        decimals: this.toToken.decimals
      };

      this.profileProvider
        .createCustomTokenWallet(this.toWalletSelected, customToken)
        .then(() => {
          // store preferences for the paired eth wallet
          this.walletProvider.updateRemotePreferences(this.toWalletSelected);
          this.events.publish('Local/FetchWallets');
        });
    }
  }

  private setExpirationDate(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
  }

  private paymentTimeControl(minutes: number): void {
    const expirationDate = this.setExpirationDate(new Date(), minutes);
    const expirationTime = Math.floor(expirationDate.getTime() / 1000);
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

  public getChain(coin: string): string {
    return this.currencyProvider.getChain(coin).toLowerCase();
  }

  private publishAndSign(wallet, txp): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!wallet.canSign) {
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

  public makePayment() {
    this.onGoingProcessProvider.set('creatingTx');
    this.createTx(this.fromWalletSelected)
      .then(ctxp => {
        this.ctxp = ctxp;

        this.onGoingProcessProvider.set('broadcastingTx');

        this.publishAndSign(this.fromWalletSelected, this.ctxp)
          .then(txSent => {
            this.saveOneInchData(txSent);
            this.createAndBindTokenWallet();
          })
          .catch(err => {
            this.logger.error(this.bwcErrorProvider.msg(err));
            this.showErrorAndBack(
              null,
              this.translate.instant('Could not send transaction')
            );
            return;
          })
          .catch(err => {
            this.logger.error(this.bwcErrorProvider.msg(err));
            this.showErrorAndBack(null, err);
            this.logger.warn(
              'Error on publishAndSign: removing payment proposal'
            );
            this.walletProvider
              .removeTx(this.fromWalletSelected, this.ctxp)
              .catch(() => {
                this.logger.warn('Could not delete payment proposal');
              });
            return;
          });
      })
      .catch(err => {
        this.showErrorAndBack(err.title, err.message);
        return;
      });
  }

  private createTx(wallet): Promise<any> {
    return new Promise((resolve, reject) => {
      const toMsg: string = !_.isEmpty(this.toToken)
        ? this.toToken.symbol.toUpperCase()
        : this.toWalletSelected.coin.toUpperCase();

      const message: string =
        this.fromWalletSelected.coin.toUpperCase() + ' to ' + toMsg;
      let outputs = [];

      outputs.push({
        toAddress: this.swapData.tx.to,
        amount: Number(this.swapData.tx.value),
        message,
        data: this.swapData.tx.data,
        gasLimit: this.gasLimit
      });

      let txp: Partial<TransactionProposal> = {
        toAddress: this.swapData.tx.to,
        amount: Number(this.swapData.tx.value),
        outputs,
        message,
        excludeUnconfirmedUtxos: true, // Do not use unconfirmed UTXOs
        customData: {
          oneInch: this.swapData.tx.to,
          service: 'oneInch'
        }
      };

      txp.feePerKb = this.gasPrice;
      txp.coin = wallet.coin;
      txp.chain = this.currencyProvider.getChain(txp.coin);

      if (this.currencyProvider.isERCToken(wallet.coin)) {
        let tokenAddress;
        let tokens = this.currencyProvider.getAvailableTokens();
        const token = tokens.find(x => x.symbol == wallet.coin.toUpperCase());

        tokenAddress = token.address;

        if (tokenAddress) {
          txp.tokenAddress = tokenAddress;
          txp.isTokenSwap = true;

          for (const output of txp.outputs) {
            if (!output.data) {
              output.data = this.bwcProvider
                .getCore()
                .Transactions.get({ chain: 'ERC20' })
                .encodeData({
                  recipients: [
                    { address: output.toAddress, amount: output.amount }
                  ],
                  tokenAddress
                });
            }
          }
        }
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

  private saveOneInchData(txSent): void {
    const now = moment().unix() * 1000;

    let newData = {
      txId: txSent.txid,
      date: now,
      amountTo: this.amountTo,
      coinTo: this.toToken.symbol.toLowerCase(),
      addressTo: this.addressTo,
      walletIdTo: this.toWalletSelected.id,
      amountFrom: this.amountFrom,
      coinFrom: this.fromWalletSelected.coin,
      addressFrom: this.addressFrom,
      walletIdFrom: this.fromWalletSelected.id,
      totalExchangeFee: this.totalExchangeFee,
      error: null
    };

    this.oneInchProvider.saveOneInch(newData, null).then(() => {
      this.logger.debug('Saved exchange with txid: ' + newData.txId);
      this.analyticsProvider.logEvent('exchange_crypto_payment_sent', {
        userId: this.fromWalletSelected.id,
        coinFrom: this.fromWalletSelected.coin,
        coinTo: this.toToken.symbol.toLowerCase(),
        amountFrom: this.amountFrom,
        amountTo: this.amountTo,
        exchange: 'oneInch'
      });
      this.onGoingProcessProvider.clear();
      this.openFinishModal();
    });
  }

  private openFinishModal(): void {
    let finishText = 'Transaction Sent';
    let modal = this.modalCtrl.create(
      FinishModalPage,
      { finishText, coin: this.fromWalletSelected.coin },
      { showBackdrop: true, enableBackdropDismiss: false }
    );
    modal.present();
    modal.onDidDismiss(async () => {
      await this.navCtrl.popToRoot({ animate: false });
      await this.navCtrl.push(OneInchPage, null, { animate: false });
    });
  }

  private showErrorAndBack(title: string, msg, noExit?: boolean): void {
    title = title ? title : this.translate.instant('Error');
    this.logger.error(msg);
    msg = msg && msg.error && msg.error.message ? msg.error.message : msg;
    const errorActionSheet = this.actionSheetProvider.createInfoSheet(
      'default-error',
      {
        msg,
        title
      }
    );
    this.onGoingProcessProvider.clear();
    errorActionSheet.present();
    errorActionSheet.onDidDismiss(_option => {
      if (!noExit) {
        this.onGoingProcessProvider.clear();
        this.navCtrl.pop();
      }
    });
  }

  public canContinue(): boolean {
    return !this.paymentExpired;
  }

  public cancelExchange() {
    this.navCtrl.popToRoot();
  }
}
