import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ModalController, NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';
import * as moment from 'moment';

// Pages
import { OneInchPage } from '../../pages/integrations/one-inch/one-inch';
import { AmountPage } from '../../pages/send/amount/amount';
import { TokenSwapApprovePage } from '../../pages/token-swap/token-swap-approve/token-swap-approve';
import { TokenSwapCheckoutPage } from '../../pages/token-swap/token-swap-checkout/token-swap-checkout';

// Providers
import { ActionSheetProvider } from '../../providers/action-sheet/action-sheet';
import { ConfigProvider } from '../../providers/config/config';
import { CurrencyProvider } from '../../providers/currency/currency';
import { ExchangeCryptoProvider } from '../../providers/exchange-crypto/exchange-crypto';
import { ExternalLinkProvider } from '../../providers/external-link/external-link';
import { Logger } from '../../providers/logger/logger';
import { OnGoingProcessProvider } from '../../providers/on-going-process/on-going-process';
import { OneInchProvider } from '../../providers/one-inch/one-inch';
import { ProfileProvider } from '../../providers/profile/profile';
import { ReplaceParametersProvider } from '../../providers/replace-parameters/replace-parameters';
import { ThemeProvider } from '../../providers/theme/theme';
import { TxFormatProvider } from '../../providers/tx-format/tx-format';
import { WalletProvider } from '../../providers/wallet/wallet';

@Component({
  selector: 'page-token-swap',
  templateUrl: 'token-swap.html'
})
export class TokenSwapPage {
  public isOpenSelectorFrom: boolean;
  public isOpenSelectorTo: boolean;
  public allWallets;
  public toWallets;
  public fromWallets;
  public loading: boolean;
  public oneInchSwapTxs: any[];
  public useSendMax: boolean;
  public sendMaxInfo;
  public showApproveButton: boolean;
  public showPendingApprove: boolean;
  public approveButtonText: string;
  private approveTxId: string;
  private approveSpenderAddress: string;

  public oneInchSupportedCoins: any[];
  public oneInchSupportedCoinsSymbols: string[];
  public supportedCoinsFull;
  public slippageValues: any[];
  public selectedSlippage: number;
  private referrerFee: number;

  public fromWalletSelectorTitle: string;
  public toWalletSelectorTitle: string;
  public fromWalletSelected;
  public toWalletSelected;
  public fromToken;
  public toToken;
  public swapData;

  public amountFrom: number;
  public amountTo: number;
  public minAmount: number;
  public maxAmount: number;
  public rate: number;
  public estimatedFee: number;

  private supportedCoins: string[];

  constructor(
    private actionSheetProvider: ActionSheetProvider,
    private logger: Logger,
    private modalCtrl: ModalController,
    private navCtrl: NavController,
    private navParams: NavParams,
    private oneInchProvider: OneInchProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private profileProvider: ProfileProvider,
    private translate: TranslateService,
    private configProvider: ConfigProvider,
    private currencyProvider: CurrencyProvider,
    private txFormatProvider: TxFormatProvider,
    private exchangeCryptoProvider: ExchangeCryptoProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private replaceParametersProvider: ReplaceParametersProvider,
    public themeProvider: ThemeProvider,
    private walletProvider: WalletProvider
  ) {
    this.allWallets = [];
    this.toWallets = [];
    this.fromWallets = [];
    this.oneInchSupportedCoins = [];
    this.oneInchSupportedCoinsSymbols = [];
    this.loading = false;
    this.showApproveButton = false;
    this.fromWalletSelectorTitle = this.translate.instant(
      'Select Source Wallet'
    );
    this.toWalletSelectorTitle = this.translate.instant(
      'Select Destination Wallet'
    );
    this.slippageValues = [
      {
        value: 0.1,
        selected: false
      },
      {
        value: 0.5,
        selected: true
      },
      {
        value: 1,
        selected: false
      }
    ];
    this.setSlippage(0.5);
    this.onGoingProcessProvider.set('connectingOneInch');

    this.exchangeCryptoProvider.getSwapTxs().then(res => {
      this.oneInchSwapTxs = res.oneInchSwapTxs;
    });
  }

  private checkConfirmation(ms: number) {
    this.logger.debug('waiting ' + ms + ' ms to verifyAllowances');
    const currentIndex = this.navCtrl.getActive().index;
    const currentView = this.navCtrl.getViews();

    if (currentView[currentIndex].name == 'TokenSwapPage') {
      setTimeout(
        () => {
          this.verifyAllowances();
        },
        ms ? ms : 15000
      );
    }
  }

  async ionViewDidLoad() {
    this.logger.info('Loaded: TokenSwapPage');

    await this.oneInchProvider
      .approveSpender1inch()
      .then((approveSpenderData: any) => {
        this.approveSpenderAddress = approveSpenderData.address;
      })
      .catch(err => {
        this.logger.error('1Inch approveSpender1inch Error: ', err);
        this.showErrorAndBack(
          null,
          this.translate.instant(
            '1Inch is not available at this moment. Please, try again later.'
          )
        );
      });

    this.oneInchProvider
      .healthCheck1inch()
      .then((data: any) => {
        if (data && data.status)
          this.logger.debug('One inch status: ' + data.status);
        this.oneInchProvider
          .getCurrencies1inch()
          .then(data => {
            if (_.isEmpty(data)) {
              this.logger.error('1Inch getCurrencies Error');
              this.showErrorAndBack(
                null,
                this.translate.instant(
                  '1Inch is not available at this moment. Please, try again later.'
                )
              );
              return;
            }

            if (data && data.tokens) {
              this.oneInchSupportedCoins = [];
              this.oneInchSupportedCoinsSymbols = [];

              _.forEach(Object.keys(data.tokens), key => {
                this.oneInchSupportedCoins.push(data.tokens[key]);
                this.oneInchSupportedCoinsSymbols.push(
                  data.tokens[key].symbol.toLowerCase()
                );
              });

              if (
                _.isArray(this.oneInchSupportedCoins) &&
                this.oneInchSupportedCoins.length > 0
              ) {
                this.supportedCoins = _.intersection(
                  this.currencyProvider.getAvailableCoins(),
                  this.oneInchSupportedCoinsSymbols
                );
              }

              this.supportedCoinsFull = this.oneInchSupportedCoins.filter(
                token => {
                  return this.supportedCoins.includes(
                    token.symbol.toLowerCase()
                  );
                }
              );
            }

            this.logger.debug('1Inch supportedCoins: ' + this.supportedCoins);

            this.allWallets = this.profileProvider.getWallets({
              network: 'livenet',
              onlyComplete: true,
              coin: this.supportedCoins,
              backedUp: true
            });

            this.onGoingProcessProvider.clear();

            if (_.isEmpty(this.allWallets)) {
              this.showErrorAndBack(
                null,
                this.translate.instant(
                  'No wallets available to use this exchange'
                )
              );
              return;
            }

            this.fromWallets = this.allWallets.filter(w => {
              return w.cachedStatus && w.cachedStatus.availableBalanceSat > 0;
            });

            if (_.isEmpty(this.fromWallets)) {
              this.showErrorAndBack(
                null,
                this.translate.instant('No wallets with funds')
              );
              return;
            }

            if (this.navParams.data.walletId) {
              const wallet = this.profileProvider.getWallet(
                this.navParams.data.walletId
              );
              if (wallet.network != 'livenet') {
                this.showErrorAndBack(
                  null,
                  this.translate.instant('Unsupported network')
                );
                return;
              }
              if (!wallet.coin || !this.supportedCoins.includes(wallet.coin)) {
                this.showErrorAndBack(
                  null,
                  this.translate.instant(
                    'Currently our partner does not support exchanges with the selected coin'
                  )
                );
                return;
              } else {
                if (
                  wallet.cachedStatus &&
                  wallet.cachedStatus.spendableAmount &&
                  wallet.cachedStatus.spendableAmount > 0
                ) {
                  this.onWalletSelect(wallet, 'from');
                } else {
                  this.onWalletSelect(wallet, 'to');
                }
              }
            }
          })
          .catch(err => {
            this.logger.error('1Inch getCurrencies Error: ', err);
            this.showErrorAndBack(
              null,
              this.translate.instant(
                '1Inch is not available at this moment. Please, try again later.'
              )
            );
          });
      })
      .catch(err => {
        this.logger.error('1Inch healthCheck1inch Error: ', err);
        this.showErrorAndBack(
          null,
          this.translate.instant(
            '1Inch is not available at this moment. Please, try again later.'
          )
        );
      });
  }

  public showWallets(selector: string): void {
    let walletsForActionSheet = [];
    let selectedWalletId: string;
    let title: string =
      selector == 'from'
        ? this.fromWalletSelectorTitle
        : this.toWalletSelectorTitle;
    if (selector == 'from') {
      this.isOpenSelectorFrom = true;
      walletsForActionSheet = this.fromWallets;
      selectedWalletId = this.fromWalletSelected
        ? this.fromWalletSelected.id
        : null;
    } else if (selector == 'to') {
      this.isOpenSelectorTo = true;
      walletsForActionSheet = this.toWallets;
      selectedWalletId = this.toWalletSelected
        ? this.toWalletSelected.id
        : null;
    }
    const params = {
      wallets: walletsForActionSheet,
      selectedWalletId,
      title
    };
    const walletSelector = this.actionSheetProvider.createWalletSelector(
      params
    );
    walletSelector.present();
    walletSelector.onDidDismiss(wallet => {
      this.isOpenSelectorFrom = false;
      this.isOpenSelectorTo = false;

      if (!_.isEmpty(wallet)) this.onWalletSelect(wallet, selector);
    });
  }

  private showToWallets(): void {
    this.toWallets = this.allWallets.filter(
      w =>
        !w.needsBackup &&
        w.id != this.fromWalletSelected.id &&
        w.coin != this.fromWalletSelected.coin
    );

    if (_.isEmpty(this.toWallets)) {
      let msg = this.translate.instant(
        'Destination wallet needs to be backed up'
      );
      this.showErrorAndBack(null, msg);
      return;
    }
  }

  public onWalletSelect(wallet, selector: string): void {
    if (selector == 'from') {
      this.onGoingProcessProvider.set('Verifiyng allowances and balances...');
      this.onFromWalletSelect(wallet);
    } else if (selector == 'to') {
      this.onToWalletSelect(wallet);
    }
  }

  public onFromWalletSelect(wallet): void {
    this.fromWalletSelected = wallet;
    this.toWalletSelected = null; // Clear variable to select wallet again
    this.amountFrom = null; // Clear amount and rate to avoid mistakes
    this.rate = null;

    this.fromToken = this.supportedCoinsFull.filter(token => {
      return (
        token.symbol.toLowerCase() == this.fromWalletSelected.coin.toLowerCase()
      );
    })[0];

    this.verifyAllowances();
  }

  public onToWalletSelect(wallet): void {
    this.toWalletSelected = wallet;
    this.updateMaxAndMin();
  }

  private verifyAllowances() {
    this.logger.debug('Verifiying allowances...');
    this.walletProvider
      .getAddress(this.fromWalletSelected, false)
      .then(fromAddress => {
        const data = {
          spenderAddress: this.approveSpenderAddress,
          addressToCheck: fromAddress
        };
        this.oneInchProvider
          .verifyAllowancesAndBalances(data)
          .then(allowancesData => {
            this.logger.debug(allowancesData[this.fromToken.address]);
            if (
              allowancesData[this.fromToken.address] &&
              allowancesData[this.fromToken.address].allowance > 0
            ) {
              this.logger.debug(
                'This wallet has the necessary allowances to continue with the token swap'
              );
              this.showApproveButton = false;
              this.showPendingApprove = false;
              this.approveButtonText = '';
            } else {
              // check if an approve transaction was already sent for this wallet
              this.oneInchProvider
                .getOneInchApproveData()
                .then(oneInchApproveData => {
                  const approveTxs: any = {};
                  Object.assign(approveTxs, oneInchApproveData);
                  if (
                    approveTxs &&
                    approveTxs[this.fromWalletSelected.id] &&
                    approveTxs[this.fromWalletSelected.id].txId
                  ) {
                    this.logger.debug(
                      'There is a pending transaction waiting for confirmation'
                    );
                    this.showPendingApprove = true;
                    this.approveTxId =
                      approveTxs[this.fromWalletSelected.id].txId;
                    this.checkConfirmation(15000);
                  } else {
                    this.showPendingApprove = false;
                    this.showApproveButton = true;
                    this.approveButtonText = this.replaceParametersProvider.replace(
                      this.translate.instant(`Approve {{fromWalletCoin}}`),
                      {
                        fromWalletCoin: this.fromWalletSelected.coin.toUpperCase()
                      }
                    );
                  }
                })
                .catch(err => {
                  this.logger.error('1Inch getOneInchApproveData Error: ', err);
                  this.showErrorAndBack(
                    null,
                    this.translate.instant(
                      '1Inch is not available at this moment. Please, try again later.'
                    )
                  );
                  return;
                });
            }
            this.showToWallets();
            this.onGoingProcessProvider.clear();
          })
          .catch(err => {
            this.logger.error('1Inch verifyAllowancesAndBalances Error: ', err);
            this.showErrorAndBack(
              null,
              this.translate.instant(
                '1Inch is not available at this moment. Please, try again later.'
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
            'There was a problem retrieving the fromAddress. Please, try again later.'
          )
        );
        return;
      });
  }

  private async updateMaxAndMin() {
    this.amountTo = null;
    this.rate = null;
    if (!this.fromWalletSelected || !this.toWalletSelected || !this.amountFrom)
      return;

    this.loading = true;
    let pair = this.fromWalletSelected.coin + '_' + this.toWalletSelected.coin;
    this.logger.debug('Updating max and min with pair: ' + pair);

    this.referrerFee = await this.oneInchProvider.getReferrerFee();

    this.logger.debug(`referrerFee setted to: ${this.referrerFee}%`);

    this.toToken = this.supportedCoinsFull.filter(token => {
      return (
        token.symbol.toLowerCase() == this.toWalletSelected.coin.toLowerCase()
      );
    })[0];

    const data = {
      fromTokenAddress: this.fromToken.address,
      toTokenAddress: this.toToken.address,
      amount: this.amountFrom * 10 ** this.fromToken.decimals, // amount in minimum unit
      fee: this.referrerFee // taking this fee from BWS. This percentage of fromTokenAddress token amount  will be sent to referrerAddress, the rest will be used as input for a swap | min: 0; max: 3; default: 0;
    };
    this.oneInchProvider
      .getQuote1inch(data)
      .then(data => {
        if (
          this.fromWalletSelected.cachedStatus &&
          this.fromWalletSelected.cachedStatus.spendableAmount
        ) {
          const spendableAmount = this.txFormatProvider.satToUnit(
            this.fromWalletSelected.cachedStatus.spendableAmount,
            this.fromWalletSelected.coin
          );

          if (spendableAmount < this.amountFrom) {
            this.loading = false;
            this.showErrorAndBack(
              null,
              this.translate.instant(
                'You are trying to send more funds than you have available. Make sure you do not have funds locked by pending transaction proposals or enter a valid amount.'
              ),
              true
            );
            return;
          }
        }

        const pair =
          this.fromWalletSelected.coin + '_' + this.toWalletSelected.coin;
        this.logger.debug('Updating receiving amount with pair: ' + pair);

        this.amountTo =
          Number(data.toTokenAmount) / 10 ** this.toToken.decimals;
        this.rate = this.amountTo / this.amountFrom;
        this.loading = false;
      })
      .catch(err => {
        this.logger.error('OneInch getPairsParams Error: ', err);
        this.showErrorAndBack(
          null,
          this.translate.instant(
            'OneInch is not available at this moment. Please, try again later.'
          )
        );
      });
  }

  public setSlippage(value: number) {
    if (value == this.selectedSlippage) return;

    this.selectedSlippage = value;
    this.slippageValues.forEach(element => {
      element.selected = element.value == value ? true : false;
    });
  }

  private showErrorAndBack(title: string, msg, noExit?: boolean): void {
    this.onGoingProcessProvider.clear();
    this.loading = false;
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
    errorActionSheet.present();
    errorActionSheet.onDidDismiss(_option => {
      if (!noExit) this.navCtrl.pop();
    });
  }

  public openAmountModal() {
    let modal = this.modalCtrl.create(
      AmountPage,
      {
        fixedUnit: false,
        fromTokenSwap: true, // TODO: use this to show send max
        walletId: this.fromWalletSelected.id,
        coin: this.fromWalletSelected.coin,
        useAsModal: true
      },
      {
        showBackdrop: true,
        enableBackdropDismiss: true
      }
    );
    modal.present();
    modal.onDidDismiss(data => {
      if (data) {
        this.amountFrom = this.txFormatProvider.satToUnit(
          data.amount,
          data.coin
        );
        this.useSendMax = data.useSendMax;
        this.updateMaxAndMin();
      }
    });
  }

  public canContinue(): boolean {
    return (
      this.toWalletSelected &&
      this.fromWalletSelected &&
      this.amountTo &&
      this.amountFrom > 0
    );
  }

  public continue() {
    // TODO: check if selling amount <= allowance value
    this.goToExchangeCheckoutPage();
  }

  private goToExchangeCheckoutPage() {
    const data = {
      fromWalletSelectedId: this.fromWalletSelected.id,
      toWalletSelectedId: this.toWalletSelected.id,
      fromTokenSelected: this.fromToken,
      toTokenSelected: this.toToken,
      amountFrom: this.amountFrom,
      coinFrom: this.fromWalletSelected.coin,
      coinTo: this.toWalletSelected.coin,
      rate: this.rate,
      useSendMax: this.useSendMax,
      sendMaxInfo: this.sendMaxInfo,
      slippage: this.selectedSlippage,
      referrerFee: this.referrerFee
    };

    this.navCtrl.push(TokenSwapCheckoutPage, data);
  }

  public showExchangeApproveModal() {
    let modal = this.modalCtrl.create(
      TokenSwapApprovePage,
      {
        fromWalletSelectedId: this.fromWalletSelected.id,
        fromTokenSelected: this.fromToken,
        toTokenSelected: this.toToken
      },
      {
        showBackdrop: true,
        enableBackdropDismiss: true
      }
    );
    modal.present();
    modal.onDidDismiss(data => {
      if (data && data.txid) {
        this.approveTxId = data.txid;
        this.saveApproveData(this.approveTxId);
        this.checkConfirmation(15000);
        this.showPendingApprove = true;
        this.showApproveButton = false;
      }
    });
  }

  private saveApproveData(txId: string): void {
    const now = moment().unix() * 1000;

    let newData = {
      walletId: this.fromWalletSelected.id,
      txId,
      date: now
    };

    const opts = {
      isApprove: true
    };

    this.oneInchProvider.saveOneInch(newData, opts).then(() => {
      this.logger.debug(
        'Saved spender approve with walletId: ' + this.fromWalletSelected.id
      );
      this.onGoingProcessProvider.clear();
    });
  }

  // private removeApproveData(walletId: string): void {
  //   let dataToRemove = {
  //     walletId
  //   };

  //   const opts = {
  //     isApprove: true,
  //     remove: true
  //   };

  //   this.oneInchProvider.saveOneInch(dataToRemove, opts).then(() => {
  //     this.logger.debug(
  //       'Removed spender approve with walletId: ' + this.fromWalletSelected.id
  //     );
  //     this.onGoingProcessProvider.clear();
  //   });
  // }

  public showSlippageInfo(): void {
    const infoSheet = this.actionSheetProvider.createInfoSheet('slippage-info');
    infoSheet.present();
    infoSheet.onDidDismiss(option => {
      if (option) {
      }
    });
  }

  public viewOnBlockchain(): void {
    let defaults = this.configProvider.getDefaults();
    const blockexplorerUrl =
      defaults.blockExplorerUrl[this.fromWalletSelected.coin];

    let url = `https://${blockexplorerUrl}tx/${this.approveTxId}`;
    this.externalLinkProvider.open(url);
  }

  public goToExchangeHistory() {
    this.navCtrl.push(OneInchPage);
  }
}
