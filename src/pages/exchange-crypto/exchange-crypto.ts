import { DecimalPipe } from '@angular/common';
import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  ModalController,
  NavController,
  NavParams,
  Platform
} from 'ionic-angular';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Subscription } from 'rxjs';

// Pages
import { CoinAndWalletSelectorPage } from '../../pages/coin-and-wallet-selector/coin-and-wallet-selector';
import { ExchangeCheckoutPage } from '../../pages/exchange-crypto/exchange-checkout/exchange-checkout';
import { ExchangeCryptoSettingsPage } from '../../pages/exchange-crypto/exchange-crypto-settings/exchange-crypto-settings';
import { ChangellyPage } from '../../pages/integrations/changelly/changelly';
import { OneInchPage } from '../../pages/integrations/one-inch/one-inch';
import { AmountPage } from '../../pages/send/amount/amount';
import { TokenSwapApprovePage } from '../../pages/token-swap/token-swap-approve/token-swap-approve';
import { TokenSwapCheckoutPage } from '../../pages/token-swap/token-swap-checkout/token-swap-checkout';

// Providers
import { ActionSheetProvider } from '../../providers/action-sheet/action-sheet';
import { ChangellyProvider } from '../../providers/changelly/changelly';
import { CurrencyProvider } from '../../providers/currency/currency';
import { ExchangeCryptoProvider } from '../../providers/exchange-crypto/exchange-crypto';
import { FeeProvider } from '../../providers/fee/fee';
import { LocationProvider } from '../../providers/location/location';
import { Logger } from '../../providers/logger/logger';
import { OnGoingProcessProvider } from '../../providers/on-going-process/on-going-process';
import { ProfileProvider } from '../../providers/profile/profile';
import { ThemeProvider } from '../../providers/theme/theme';
import { TxFormatProvider } from '../../providers/tx-format/tx-format';
import { WalletProvider } from '../../providers/wallet/wallet';

import { ConfigProvider } from '../../providers/config/config';
import { ExternalLinkProvider } from '../../providers/external-link/external-link';
import { OneInchProvider } from '../../providers/one-inch/one-inch';
import { ReplaceParametersProvider } from '../../providers/replace-parameters/replace-parameters';
@Component({
  selector: 'page-exchange-crypto',
  templateUrl: 'exchange-crypto.html'
})
export class ExchangeCryptoPage {
  private onResumeSubscription: Subscription;
  private onPauseSubscription: Subscription;

  public isOpenSelectorFrom: boolean;
  public isOpenSelectorTo: boolean;
  public allWallets;
  public toWallets;
  public fromWallets;
  public loading: boolean;
  public changellySwapTxs: any[];
  public useSendMax: boolean;
  public sendMaxInfo;
  public exchangeToUse: string;

  public fromWalletSelectorTitle: string;
  public toWalletSelectorTitle: string;
  public fromWalletSelected;
  public toWalletSelected;
  public toWalletSelectedByDefault;

  public amountFrom: number;
  public amountTo: number;
  public minAmount: number;
  public maxAmount: number;
  public fixedRateId: string;
  public rate: number;
  public estimatedFee: number;
  public isAvailable: {
    changelly?: boolean;
    oneInch?: boolean;
  };
  private exchangeCryptoSupportedCoins: any[];
  private changellySupportedCoins: string[]; // Supported by Changelly and Bitpay

  // One Inch
  public oneInchSwapTxs: any[];
  public showApproveButton: boolean;
  public showPendingApprove: boolean;
  public approveButtonText: string;
  private fromWalletAllowanceOk: boolean;
  private approveTxId: string;
  private approveSpenderAddress: string;
  private timeout: NodeJS.Timeout;

  public oneInchSupportedCoins: any[]; // Supported by oneInch and Bitpay
  public oneInchAllSupportedCoins: any[];
  public oneInchAllSupportedCoinsSymbols: string[];
  public oneInchSupportedCoinsFull;
  public slippageValues: any[];
  public selectedSlippage: number;
  private referrerFee: number;

  public fromToken;
  public fromTokenBalance;
  public toToken;
  public swapData;

  constructor(
    private actionSheetProvider: ActionSheetProvider,
    private logger: Logger,
    private modalCtrl: ModalController,
    private changellyProvider: ChangellyProvider,
    private navCtrl: NavController,
    private navParams: NavParams,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private platform: Platform,
    private profileProvider: ProfileProvider,
    private translate: TranslateService,
    public currencyProvider: CurrencyProvider,
    private txFormatProvider: TxFormatProvider,
    private exchangeCryptoProvider: ExchangeCryptoProvider,
    private feeProvider: FeeProvider,
    private walletProvider: WalletProvider,
    public themeProvider: ThemeProvider,
    private oneInchProvider: OneInchProvider,
    private configProvider: ConfigProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private replaceParametersProvider: ReplaceParametersProvider,
    public decimalPipe: DecimalPipe,
    private locationProvider: LocationProvider
  ) {
    this.allWallets = [];
    this.toWallets = [];
    this.fromWallets = [];
    this.loading = false;

    this.exchangeCryptoSupportedCoins = [];
    this.oneInchSupportedCoins = []; // Supported by oneInch and Bitpay
    this.oneInchAllSupportedCoins = [];
    this.oneInchAllSupportedCoinsSymbols = [];
    this.showApproveButton = false;
    this.fromWalletAllowanceOk = false;

    this.fromWalletSelectorTitle = this.translate.instant(
      'Select Source Wallet'
    );
    this.toWalletSelectorTitle = this.translate.instant(
      'Select Destination Wallet'
    );

    this.isAvailable = {
      changelly: true,
      oneInch: true
    };

    this.onGoingProcessProvider.set('exchangeCryptoInit');

    this.slippageValues = [
      {
        value: 0.1,
        selected: false
      },
      {
        value: 0.5,
        selected: false
      },
      {
        value: 1,
        selected: true
      },
      {
        value: 5,
        selected: false
      }
    ];
    this.setSlippage(1);

    this.exchangeCryptoProvider.getSwapTxs().then(res => {
      // TODO: unify getSwapTxs and review the html
      this.changellySwapTxs = res.changellySwapTxs;
    });

    this.exchangeCryptoProvider.getSwapTxs().then(res => {
      this.oneInchSwapTxs = res.oneInchSwapTxs;
    });
  }

  ngOnDestroy() {
    if (this.timeout) clearTimeout(this.timeout);
    this.onResumeSubscription.unsubscribe();
    this.onPauseSubscription.unsubscribe();
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: ExchangeCryptoPage');

    this.getExchangesCurrencies();
    this.onPauseSubscription = this.platform.pause.subscribe(() => {
      this.logger.debug('Swap - onPauseSubscription called');
      if (this.timeout) {
        this.logger.debug('Swap - onPauseSubscription clearing timeout');
        clearTimeout(this.timeout);
      }
    });
    this.onResumeSubscription = this.platform.resume.subscribe(() => {
      this.logger.debug('Swap - onResumeSubscription called');
      if (this.exchangeToUse == '1inch' && !this.fromWalletAllowanceOk) {
        this.logger.debug('Swap - onResumeSubscription checking Confirmation');
        this.checkConfirmation(1000);
      }
    });
  }

  private async getExchangesCurrencies() {
    let country;
    const reflect = promiseObj => {
      return promiseObj.promise.then(
        v => {
          return { exchange: promiseObj.exchange, status: 'ok', data: v };
        },
        error => {
          return {
            exchange: promiseObj.exchange,
            status: 'failed',
            reason: error
          };
        }
      );
    };

    const promises = [
      {
        exchange: 'changelly',
        promise: this.changellyProvider.getCurrencies(true)
      }
    ];

    try {
      country = await this.locationProvider.getCountry();
      const opts = { country };
      this.logger.debug(`Setting available currencies for country: ${country}`);

      this.isAvailable.oneInch = await this.exchangeCryptoProvider.checkServiceAvailability(
        '1inch',
        opts
      );
      this.logger.debug(`1Inch isAvailable: ${this.isAvailable.oneInch}`);
    } catch (e) {
      this.logger.warn("It was not possible to get the user's country.", e);
    }

    if (this.isAvailable.oneInch) {
      promises.push({
        exchange: '1inch',
        promise: this.oneInchProvider.getCurrencies1inch()
      });
    }
    const results = await Promise.all(promises.map(reflect));
    const successfulPromises = results.filter(p => p.status === 'ok');
    const failedPromises = results.filter(p => p.status === 'failed');

    failedPromises.forEach(promise => {
      switch (promise.exchange) {
        case '1inch':
          this.logger.error('1Inch getCurrencies Error');
          if (promise.reason && promise.reason.message)
            this.logger.error(promise.reason.message);
          break;

        case 'changelly':
          this.logger.error('Changelly getCurrencies Error');
          if (promise.reason && promise.reason.message)
            this.logger.error(promise.reason.message);
          break;

        default:
          break;
      }
    });

    successfulPromises.forEach(promise => {
      switch (promise.exchange) {
        case '1inch':
          if (!promise.data || !promise.data.tokens) {
            this.logger.error('1Inch getCurrencies Error');
            return;
          }

          this.oneInchSupportedCoins;
          this.oneInchAllSupportedCoins = [];
          this.oneInchAllSupportedCoinsSymbols = [];

          _.forEach(Object.keys(promise.data.tokens), key => {
            this.oneInchAllSupportedCoins.push(promise.data.tokens[key]);
            this.oneInchAllSupportedCoinsSymbols.push(
              promise.data.tokens[key].symbol.toLowerCase()
            );
          });

          if (
            _.isArray(this.oneInchAllSupportedCoins) &&
            this.oneInchAllSupportedCoins.length > 0
          ) {
            this.oneInchSupportedCoins = _.intersection(
              this.currencyProvider.getAvailableCoins(),
              this.oneInchAllSupportedCoinsSymbols
            );
          }

          this.oneInchSupportedCoinsFull = this.oneInchAllSupportedCoins.filter(
            token => {
              return this.oneInchSupportedCoins.includes(
                token.symbol.toLowerCase()
              );
            }
          );

          this.logger.debug(
            '1Inch supportedCoins: ' + this.oneInchSupportedCoins
          );
          break;

        case 'changelly':
          if (promise.data.error) {
            this.logger.error(
              'Changelly getCurrencies Error: ' + promise.data.error.message
            );
            return;
          }

          if (
            promise.data &&
            promise.data.result &&
            _.isArray(promise.data.result) &&
            promise.data.result.length > 0
          ) {
            const availableChains: string[] = this.currencyProvider.getAvailableChains();
            const supportedCoinsWithFixRateEnabled = promise.data.result
              .filter(
                coin =>
                  coin.enabled &&
                  coin.fixRateEnabled &&
                  coin.protocol &&
                  [...availableChains, 'erc20'].includes(
                    coin.protocol.toLowerCase()
                  )
              )
              .map(({ name }) => name);

            // TODO: add support to float-rate coins supported by Changelly
            this.changellySupportedCoins = _.intersection(
              this.currencyProvider.getAvailableCoins(),
              supportedCoinsWithFixRateEnabled
            );
            const coinsToRemove = country == 'US' ? ['xrp'] : [];
            coinsToRemove.forEach((coin: string) => {
              const index = this.changellySupportedCoins.indexOf(coin);
              if (index > -1) {
                this.logger.debug(
                  `Removing ${coin.toUpperCase()} from Changelly supported coins`
                );
                this.changellySupportedCoins.splice(index, 1);
              }
            });
          }

          this.logger.debug(
            'Changelly supportedCoins: ' + this.changellySupportedCoins
          );
          break;

        default:
          break;
      }
    });

    this.exchangeCryptoSupportedCoins = [
      ...new Set([
        ...this.changellySupportedCoins,
        ...this.oneInchSupportedCoins
      ])
    ]; // Union between all arrays

    this.allWallets = this.profileProvider.getWallets({
      network: 'livenet',
      onlyComplete: true,
      coin: this.exchangeCryptoSupportedCoins,
      backedUp: true
    });

    this.onGoingProcessProvider.clear();

    if (_.isEmpty(this.allWallets)) {
      this.showErrorAndBack(
        null,
        this.translate.instant(
          'There are no wallets available that meet the requirements to operate with our supported exchanges'
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
      if (
        !wallet.coin ||
        !this.exchangeCryptoSupportedCoins.includes(wallet.coin)
      ) {
        this.showErrorAndBack(
          null,
          this.translate.instant(
            'Currently our partners does not support exchanges with the selected coin'
          )
        );
        return;
      } else {
        if (
          wallet.cachedStatus &&
          wallet.cachedStatus.spendableAmount &&
          wallet.cachedStatus.spendableAmount > 0
        ) {
          this.onFromWalletSelect(wallet);
        } else {
          this.toWalletSelectedByDefault = wallet; // Use navParams wallet as default

          let supportedCoins = [];

          if (this.oneInchSupportedCoins.includes(wallet.coin))
            supportedCoins = supportedCoins.concat(this.oneInchSupportedCoins);
          if (this.changellySupportedCoins.includes(wallet.coin))
            supportedCoins = _.uniq(
              supportedCoins.concat(this.changellySupportedCoins)
            );

          this.allWallets = this.profileProvider.getWallets({
            network: 'livenet',
            onlyComplete: true,
            coin: supportedCoins,
            backedUp: true
          });

          if (_.isEmpty(this.allWallets)) {
            this.showErrorAndBack(
              null,
              this.translate.instant(
                'There are no wallets available that meet the requirements to operate with our supported exchanges'
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

          this.onToWalletSelect(wallet);
        }
      }
    }
  }

  public showFromWallets(): void {
    let walletsForActionSheet = [];
    let selectedWalletId: string;

    this.isOpenSelectorFrom = true;
    walletsForActionSheet = this.fromWallets;
    selectedWalletId = this.fromWalletSelected
      ? this.fromWalletSelected.id
      : null;

    const walletSelector = this.actionSheetProvider.createWalletSelector({
      wallets: walletsForActionSheet,
      selectedWalletId,
      title: this.fromWalletSelectorTitle
    });
    walletSelector.present();
    walletSelector.onDidDismiss(wallet => {
      this.isOpenSelectorFrom = false;
      this.isOpenSelectorTo = false;

      setTimeout(() => {
        if (!_.isEmpty(wallet)) this.onFromWalletSelect(wallet);
      }, 100);
    });
  }

  public showToWallets(): void {
    if (this.toWalletSelectedByDefault || !this.fromWalletSelected) return;
    this.isOpenSelectorTo = true;

    let supportedCoins: any[];
    let showOneInchTokensSearchBtn: boolean = false;

    if (
      this.oneInchSupportedCoins.includes(this.fromWalletSelected.coin) &&
      this.changellySupportedCoins.includes(this.fromWalletSelected.coin)
    ) {
      supportedCoins = _.clone(this.exchangeCryptoSupportedCoins);
      showOneInchTokensSearchBtn = true;
    } else if (
      this.oneInchSupportedCoins.includes(this.fromWalletSelected.coin)
    ) {
      supportedCoins = _.clone(this.oneInchSupportedCoins);
      showOneInchTokensSearchBtn = true;
    } else if (
      this.changellySupportedCoins.includes(this.fromWalletSelected.coin)
    ) {
      supportedCoins = _.clone(this.changellySupportedCoins);
      showOneInchTokensSearchBtn = false;
    }

    const index = supportedCoins.indexOf(this.fromWalletSelected.coin);
    if (index > -1) {
      supportedCoins.splice(index, 1);
    }

    const bitpaySupportedTokens: string[] = this.currencyProvider
      .getBitpaySupportedTokens()
      .map(token => token.symbol.toLowerCase());

    const oneInchAllSupportedCoins = this.oneInchAllSupportedCoins.filter(
      token => {
        return ![
          'eth',
          this.fromWalletSelected.coin,
          ...bitpaySupportedTokens
        ].includes(token.symbol.toLowerCase());
      }
    );

    let modal = this.modalCtrl.create(
      CoinAndWalletSelectorPage,
      {
        walletSelectorTitle: this.toWalletSelectorTitle,
        coinSelectorTitle: this.translate.instant('Select Destination Coin'),
        useAsModal: true,
        supportedCoins,
        removeSpecificWalletId: this.fromWalletSelected.id,
        onlyLivenet: true,
        oneInchAllSupportedCoins,
        showOneInchTokensSearchBtn
      },
      {
        showBackdrop: true,
        enableBackdropDismiss: true
      }
    );
    modal.present();
    modal.onDidDismiss(data => {
      this.isOpenSelectorFrom = false;
      this.isOpenSelectorTo = false;

      if (data) {
        setTimeout(() => {
          if (!_.isEmpty(data.wallet)) {
            if (data.selectedToken) {
              this.onToWalletSelect(data.wallet, data.selectedToken);
            } else {
              this.onToWalletSelect(data.wallet);
            }
          }
        }, 100);
      }
    });
  }

  private setExchangeToUse() {
    if (!this.fromWalletSelected || !this.toWalletSelected) return;

    const fromCoin = this.fromWalletSelected.coin;
    const toCoin = this.toToken
      ? this.toToken.symbol.toLowerCase()
      : this.toWalletSelected.coin;

    // Changelly has priority over 1inch
    if (
      this.changellySupportedCoins.length > 0 &&
      this.changellySupportedCoins.includes(fromCoin) &&
      this.changellySupportedCoins.includes(toCoin)
    ) {
      this.exchangeToUse = 'changelly';
    } else if (
      this.oneInchAllSupportedCoinsSymbols.length > 0 &&
      this.oneInchAllSupportedCoinsSymbols.includes(fromCoin) &&
      this.oneInchAllSupportedCoinsSymbols.includes(toCoin)
    ) {
      this.exchangeToUse = '1inch';
    } else {
      let msg =
        this.translate.instant(
          'Currently none of our partners accept the exchange of the selected pair: '
        ) +
        fromCoin +
        '_' +
        toCoin;
      this.showErrorAndBack(null, msg, true);
      return;
    }

    this.logger.debug('Exchange to use: ' + this.exchangeToUse);

    if (this.exchangeToUse == '1inch' && !this.isAvailable.oneInch) {
      const oneInchDisabledWarningSheet = this.actionSheetProvider.createInfoSheet(
        '1inch-disabled-warning'
      );
      oneInchDisabledWarningSheet.present();
      oneInchDisabledWarningSheet.onDidDismiss(() => {
        // Cleaning view
        if (!this.toWalletSelectedByDefault) {
          this.toWalletSelected = null;
          this.toToken = null;
        }
        this.fromWalletSelected = null;
        this.fromToken = null;
        this.amountFrom = null;
        this.amountTo = null;
        this.useSendMax = null;
        this.rate = null;
        this.fixedRateId = null;
        this.exchangeToUse = null;
        this.showPendingApprove = false;
      });
      return;
    }

    switch (this.exchangeToUse) {
      case '1inch':
        this.onGoingProcessProvider.set('Verifiyng allowances and balances...');
        if (this.timeout) clearTimeout(this.timeout);

        this.fromToken = this.oneInchSupportedCoinsFull.filter(token => {
          return (
            token.symbol.toLowerCase() ==
            this.fromWalletSelected.coin.toLowerCase()
          );
        })[0];

        this.verifyAllowances(); // this.oneInchGetRates() is inside this function

        break;
      case 'changelly':
        this.changellyGetRates();
        break;
    }
  }

  public onFromWalletSelect(wallet): void {
    this.fromWalletSelected = wallet;
    if (!this.toWalletSelectedByDefault) {
      this.toWalletSelected = null; // Clear variable to select destination wallet again
      this.toToken = null;
    }
    this.amountFrom = null; // Clear amount and rate to avoid mistakes
    this.amountTo = null;
    this.useSendMax = null;
    this.rate = null;
    this.fixedRateId = null;
    this.exchangeToUse = null;
    this.showPendingApprove = false;
    this.setExchangeToUse();
  }

  public onToWalletSelect(wallet, selectedToken?): void {
    // selectedToken: token from 1inch
    this.toWalletSelected = wallet;
    if (selectedToken) {
      this.toToken = selectedToken;
      this.toToken.isCustomToken = true;
    } else {
      this.toToken = null;
    }

    const isERCToken = this.currencyProvider.isERCToken(
      this.toWalletSelected.coin
    );

    if (
      isERCToken ||
      (this.toWalletSelected.coin == 'eth' &&
        selectedToken &&
        selectedToken.symbol)
    ) {
      const coin = isERCToken
        ? this.toWalletSelected.coin.toUpperCase()
        : selectedToken.symbol;

      const linkedEthWalletName = isERCToken
        ? this.toWalletSelected.linkedEthWalletName
        : this.toWalletSelected.name;

      const infoSheet = this.actionSheetProvider.createInfoSheet(
        'erc20-eth-fee-info',
        {
          coin,
          linkedEthWalletName
        }
      );
      infoSheet.present();
    }

    this.setExchangeToUse();
  }

  private changellyGetRates() {
    this.amountTo = null;
    this.rate = null;
    if (!this.fromWalletSelected || !this.toWalletSelected || !this.amountFrom)
      return;

    this.loading = true;
    let pair = this.fromWalletSelected.coin + '_' + this.toWalletSelected.coin;
    this.logger.debug('Updating max and min with pair: ' + pair);

    const data = {
      coinFrom: this.fromWalletSelected.coin,
      coinTo: this.toWalletSelected.coin
    };
    this.changellyProvider
      .getPairsParams(this.fromWalletSelected, data)
      .then(async data => {
        if (data.error) {
          let secondBtnText,
            url,
            msg = null;
          msg = 'Changelly getPairsParams Error: ' + data.error.message;
          if (
            Math.abs(data.error.code) == 32602 &&
            data.error.message.indexOf('Invalid currency:') != -1
          ) {
            msg = `${data.error.message}. This is a temporary Changelly decision. If you have further questions please reach out to them.`;
            secondBtnText = this.translate.instant('Submit a ticket');
            url = 'https://support.changelly.com/en/support/tickets/new';
          }

          this.showErrorAndBack(null, msg, true, secondBtnText, url);
          return;
        }

        if (
          data.result &&
          data.result[0] &&
          Number(data.result[0].maxAmountFixed) <= 0
        ) {
          const msg = `Changelly has temporarily disabled ${this.fromWalletSelected.coin}-${this.toWalletSelected.coin} pair. If you have further questions please reach out to them.`;
          const secondBtnText = this.translate.instant('Submit a ticket');
          const url = 'https://support.changelly.com/en/support/tickets/new';
          this.showErrorAndBack(null, msg, true, secondBtnText, url);
          return;
        }

        this.minAmount = Number(data.result[0].minAmountFixed);
        this.maxAmount = Number(data.result[0].maxAmountFixed);
        this.logger.debug(
          `Min amount: ${this.minAmount} - Max amount: ${this.maxAmount}`
        );

        if (this.useSendMax && this.shouldUseSendMax()) {
          this.onGoingProcessProvider.set('calculatingSendMax');
          this.sendMaxInfo = await this.getSendMaxInfo();
          if (this.sendMaxInfo) {
            this.logger.debug('Send max info', this.sendMaxInfo);
            this.amountFrom = this.txFormatProvider.satToUnit(
              this.sendMaxInfo.amount,
              this.fromWalletSelected.coin
            );
            this.estimatedFee = this.txFormatProvider.satToUnit(
              this.sendMaxInfo.fee,
              this.fromWalletSelected.coin
            );
          }
        }
        this.onGoingProcessProvider.clear();

        if (this.amountFrom > this.maxAmount) {
          const errorActionSheet = this.actionSheetProvider.createInfoSheet(
            'max-amount-allowed',
            {
              maxAmount: this.maxAmount,
              coin: this.fromWalletSelected.coin.toUpperCase()
            }
          );
          errorActionSheet.present();
          errorActionSheet.onDidDismiss(option => {
            this.loading = false;
            if (option) {
              this.amountFrom = this.maxAmount;
              this.useSendMax = null;
              this.updateReceivingAmount();
            }
          });
          return;
        }
        if (this.amountFrom < this.minAmount) {
          if (this.useSendMax && this.shouldUseSendMax()) {
            let msg;
            if (this.sendMaxInfo) {
              const warningMsg = this.exchangeCryptoProvider.verifyExcludedUtxos(
                this.fromWalletSelected.coin,
                this.sendMaxInfo
              );
              msg = !_.isEmpty(warningMsg) ? warningMsg : '';
            }

            const errorActionSheet = this.actionSheetProvider.createInfoSheet(
              'send-max-min-amount',
              {
                amount: this.amountFrom,
                fee: this.estimatedFee,
                minAmount: this.minAmount,
                coin: this.fromWalletSelected.coin.toUpperCase(),
                msg
              }
            );
            errorActionSheet.present();
            errorActionSheet.onDidDismiss(() => {
              this.loading = false;
              this.useSendMax = null;
              this.amountFrom = null;
              this.amountTo = null;
              this.estimatedFee = null;
              this.sendMaxInfo = null;
              this.rate = null;
              this.fixedRateId = null;
            });
            return;
          } else {
            const errorActionSheet = this.actionSheetProvider.createInfoSheet(
              'min-amount-allowed',
              {
                minAmount: this.minAmount,
                coin: this.fromWalletSelected.coin.toUpperCase()
              }
            );
            errorActionSheet.present();
            errorActionSheet.onDidDismiss(option => {
              this.loading = false;
              if (option) {
                this.amountFrom = this.minAmount;
                this.useSendMax = null;
                this.sendMaxInfo = null;
                this.updateReceivingAmount();
              }
            });
            return;
          }
        }
        this.updateReceivingAmount();
      })
      .catch(err => {
        this.logger.error('Changelly getPairsParams Error: ', err);
        this.showErrorAndBack(
          null,
          this.translate.instant(
            'Changelly is not available at this moment. Please, try again later.'
          )
        );
      });
  }

  private async oneInchGetRates() {
    this.amountTo = null;
    this.rate = null;
    if (!this.fromWalletSelected || !this.toWalletSelected || !this.amountFrom)
      return;

    if (this.useSendMax && this.fromWalletSelected.coin == 'eth') {
      this.useSendMax = null;
      this.amountFrom = null;
      this.amountTo = null;
      this.showErrorAndBack(
        null,
        this.translate.instant(
          'Currently the "Send Max" feature is not supported for ETH swaps on the 1Inch exchange. Try entering the amount manually.'
        ),
        true
      );
      return;
    }

    if (
      this.fromWalletSelected.cachedStatus &&
      this.fromWalletSelected.cachedStatus.spendableAmount
    ) {
      const spendableAmount = this.txFormatProvider.satToUnit(
        this.fromWalletSelected.cachedStatus.spendableAmount,
        this.fromWalletSelected.coin
      );

      if (spendableAmount < this.amountFrom && !this.useSendMax) {
        this.loading = false;
        this.amountFrom = null;
        this.amountTo = null;
        this.useSendMax = null;
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

    this.loading = true;

    try {
      this.referrerFee = await this.oneInchProvider.getReferrerFee();
    } catch (err) {
      if (err.error)
        this.logger.error('Could not get referrer fee: ', err.error);
    }

    this.logger.debug(`referrerFee setted to: ${this.referrerFee}%`);

    this.toToken =
      this.toToken && this.toToken.isCustomToken
        ? this.toToken
        : this.oneInchSupportedCoinsFull.filter(token => {
            return (
              token.symbol.toLowerCase() ==
              this.toWalletSelected.coin.toLowerCase()
            );
          })[0];

    // workaround to prevent scientific notation
    const _amount: number = this.amountFrom * 10 ** this.fromToken.decimals;
    const minUnitAmount: string = _amount.toLocaleString('fullwide', {
      useGrouping: false,
      maximumFractionDigits: 0
    });

    const data: any = {
      fromTokenAddress: this.fromToken.address,
      toTokenAddress: this.toToken.address,
      amount: minUnitAmount // amount in minimum unit
    };

    if (this.referrerFee) {
      data.fee = this.referrerFee; // taking this fee from BWS. This percentage of fromTokenAddress token amount  will be sent to referrerAddress, the rest will be used as input for a swap | min: 0; max: 3; default: 0;
    }

    this.logger.debug('quoteRequestData: ', data);
    this.oneInchProvider
      .getQuote1inch(data)
      .then(data => {
        const fromCoin = this.fromWalletSelected.coin;
        const toCoin = this.toToken
          ? this.toToken.symbol.toLowerCase()
          : this.toWalletSelected.coin;
        const pair = fromCoin + '_' + toCoin;
        this.logger.debug('Updating receiving amount with pair: ' + pair);

        this.amountTo =
          Number(data.toTokenAmount) / 10 ** this.toToken.decimals;
        this.rate = this.amountTo / this.amountFrom;
        this.loading = false;
      })
      .catch(err => {
        this.processError1Inch(err);
      });
  }

  private shouldUseSendMax() {
    const chain = this.currencyProvider.getAvailableChains();
    return chain.includes(this.fromWalletSelected.coin);
  }

  private processError1Inch(err) {
    let msg = this.translate.instant(
      '1Inch is not available at this moment. Please, try again later.'
    );

    this.logger.error(
      '1Inch getQuote1inch Error: ',
      err.error && err.error.message ? err.error.message : err
    );

    if (err.error && err.error.message && _.isString(err.error.message)) {
      if (err.error.message.includes('cannot find path for')) {
        const fromCoin = this.fromWalletSelected.coin;
        const toCoin = this.toToken
          ? this.toToken.symbol.toLowerCase()
          : this.toWalletSelected.coin;

        msg =
          this.translate.instant(
            'Currently it has not been possible to find a path that allows the transaction between the selected pair of tokens: '
          ) +
          fromCoin +
          '_' +
          toCoin;
      }
    }

    this.showErrorAndBack(null, msg);
  }

  private showErrorAndBack(
    title: string,
    msg,
    noExit?: boolean,
    secondBtnText?: string,
    url?: string
  ): void {
    this.onGoingProcessProvider.clear();
    this.loading = false;
    title = title ? title : this.translate.instant('Error');
    this.logger.error(msg);
    msg = msg && msg.error && msg.error.message ? msg.error.message : msg;
    const errorActionSheet = this.actionSheetProvider.createInfoSheet(
      'default-error',
      {
        msg,
        title,
        secondBtnText,
        url
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
        fromExchangeCrypto: true,
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

        switch (this.exchangeToUse) {
          case '1inch':
            this.oneInchGetRates();
            break;
          case 'changelly':
            this.changellyGetRates();
            break;
        }
      }
    });
  }

  private updateReceivingAmount() {
    if (
      !this.fromWalletSelected ||
      !this.toWalletSelected ||
      !this.amountFrom
    ) {
      this.loading = false;
      return;
    }

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

    const data = {
      amountFrom: this.amountFrom,
      coinFrom: this.fromWalletSelected.coin,
      coinTo: this.toWalletSelected.coin
    };
    this.changellyProvider
      .getFixRateForAmount(this.fromWalletSelected, data)
      .then(data => {
        if (data.error) {
          const msg =
            'Changelly getFixRateForAmount Error: ' + data.error.message;
          this.showErrorAndBack(null, msg, true);
          return;
        }

        this.fixedRateId = data.result[0].id;
        this.amountTo = Number(data.result[0].amountTo);
        this.rate = Number(data.result[0].result); // result == rate
        this.loading = false;
      })
      .catch(err => {
        this.logger.error('Changelly getFixRateForAmount Error: ', err);
        this.showErrorAndBack(
          null,
          this.translate.instant(
            'Changelly is not available at this moment. Please, try again later.'
          )
        );
      });
  }

  private getChain(coin: string): string {
    return this.currencyProvider.getChain(coin).toLowerCase();
  }

  private getSendMaxInfo(): Promise<any> {
    return new Promise((resolve, reject) => {
      const feeLevel =
        this.fromWalletSelected.coin == 'btc' ||
        this.getChain(this.fromWalletSelected.coin) == 'eth'
          ? 'priority'
          : this.feeProvider.getCoinCurrentFeeLevel(
              this.fromWalletSelected.coin
            );

      this.feeProvider
        .getFeeRate(
          this.fromWalletSelected.coin,
          this.fromWalletSelected.network,
          feeLevel
        )
        .then(feeRate => {
          this.walletProvider
            .getSendMaxInfo(this.fromWalletSelected, {
              feePerKb: feeRate,
              excludeUnconfirmedUtxos: true, // Do not use unconfirmed UTXOs
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

  public getAmountConteinerClass(length: number): string {
    if (length > 14) return 'fix-font-size-14';
    if (length > 12) return 'fix-font-size-12';
    if (length > 10) return 'fix-font-size-10';
    if (length > 8) return 'fix-font-size-8';
    return '';
  }

  public canContinue(): boolean {
    switch (this.exchangeToUse) {
      case '1inch':
        return (
          this.toWalletSelected &&
          this.fromWalletSelected &&
          this.fromWalletAllowanceOk &&
          this.amountTo &&
          this.amountFrom > 0
        );

      case 'changelly':
        return (
          this.toWalletSelected &&
          this.fromWalletSelected &&
          this.amountTo &&
          this.minAmount &&
          this.maxAmount &&
          this.amountFrom >= this.minAmount &&
          this.amountFrom <= this.maxAmount
        );

      default:
        return false;
    }
  }

  public goToExchangeCheckoutPage() {
    let data, checkoutPage;
    switch (this.exchangeToUse) {
      case '1inch':
        if (this.useSendMax && this.fromTokenBalance) {
          // Use fromTokenBalance for send max to prevent bigint issues
          this.amountFrom = this.txFormatProvider.satToUnit(
            this.fromTokenBalance,
            this.fromToken.symbol.toLowerCase()
          );
        }

        data = {
          fromWalletSelectedId: this.fromWalletSelected.id,
          toWalletSelectedId: this.toWalletSelected.id,
          fromTokenSelected: this.fromToken,
          toTokenSelected: this.toToken,
          amountFrom: this.amountFrom,
          coinFrom: this.fromWalletSelected.coin,
          coinTo: this.toWalletSelected.coin,
          rate: this.rate,
          useSendMax: this.useSendMax,
          fromTokenBalance: this.fromTokenBalance,
          sendMaxInfo: this.sendMaxInfo,
          slippage: this.selectedSlippage,
          referrerFee: this.referrerFee
        };

        checkoutPage = TokenSwapCheckoutPage;
        break;
      case 'changelly':
        data = {
          fromWalletSelectedId: this.fromWalletSelected.id,
          toWalletSelectedId: this.toWalletSelected.id,
          fixedRateId: this.fixedRateId,
          amountFrom: this.amountFrom,
          coinFrom: this.fromWalletSelected.coin,
          coinTo: this.toWalletSelected.coin,
          rate: this.rate,
          useSendMax: this.useSendMax,
          sendMaxInfo: this.sendMaxInfo
        };

        checkoutPage = ExchangeCheckoutPage;
        break;

      default:
        this.logger.error(
          'No exchanges matching. Exchange: ' + this.exchangeToUse
        );
        break;
    }

    this.navCtrl.push(checkoutPage, data);
  }

  public goToExchangeHistory() {
    switch (this.exchangeToUse) {
      case '1inch':
        this.navCtrl.push(OneInchPage);
        break;

      case 'changelly':
        this.navCtrl.push(ChangellyPage);
        break;

      default:
        this.navCtrl.push(ExchangeCryptoSettingsPage, {
          // TODO: review this pages when checking 1inch allowances - use only this page?
          fromExchangeCryptoPage: true
        });
        break;
    }
  }

  // *******************************************************
  // 1Inch Exchange

  public setSlippage(value: number) {
    if (value == this.selectedSlippage) return;

    this.selectedSlippage = value;
    this.slippageValues.forEach(element => {
      element.selected = element.value == value ? true : false;
    });
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
    modal.onWillDismiss(data => {
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

  private checkConfirmation(ms: number) {
    this.logger.debug('Swap - checking confirmation');
    this.timeout = setTimeout(() => this.verifyAllowances(), ms || 15000);
  }

  private verifyAllowances() {
    if (
      !this.fromWalletSelected ||
      !this.toWalletSelected ||
      this.exchangeToUse != '1inch'
    )
      return;
    this.logger.debug('Verifiying allowances...');
    this.walletProvider
      .getAddress(this.fromWalletSelected, false)
      .then(async fromAddress => {
        if (!this.approveSpenderAddress) {
          const approveSpenderData: any = await this.oneInchProvider.approveSpender1inch();
          if (!approveSpenderData || !approveSpenderData.address) {
            this.logger.error('1Inch approveSpender1inch Error');
            this.showErrorAndBack(
              null,
              this.translate.instant(
                '1Inch is not available at this moment. Please, try again later.'
              )
            );
            return;
          }

          this.approveSpenderAddress = approveSpenderData.address;
          this.logger.debug(
            '1inch spender address: ' + this.approveSpenderAddress
          );
        }

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
              allowancesData[this.fromToken.address].balance
            ) {
              this.fromTokenBalance =
                allowancesData[this.fromToken.address].balance;
            }
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
              this.fromWalletAllowanceOk = true;
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
                    this.fromWalletAllowanceOk = false;
                    this.approveTxId =
                      approveTxs[this.fromWalletSelected.id].txId;
                    this.checkConfirmation(15000);
                  } else {
                    this.showPendingApprove = false;
                    this.fromWalletAllowanceOk = false;
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

            this.onGoingProcessProvider.clear();
            this.oneInchGetRates();
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
            'There was a problem retrieving the address. Please, try again later.'
          )
        );
        return;
      });
  }

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
}
