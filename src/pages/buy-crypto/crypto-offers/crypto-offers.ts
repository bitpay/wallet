import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';

// Providers
import { AppProvider } from '../../../providers/app/app';
import { BuyCryptoProvider } from '../../../providers/buy-crypto/buy-crypto';
import { ConfigProvider } from '../../../providers/config/config';
import { Coin, CurrencyProvider } from '../../../providers/currency/currency';
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';
import { Logger } from '../../../providers/logger/logger';
import { OnGoingProcessProvider } from '../../../providers/on-going-process/on-going-process';
import { PopupProvider } from '../../../providers/popup/popup';
import { ProfileProvider } from '../../../providers/profile/profile';
import { SimplexProvider } from '../../../providers/simplex/simplex';
import { ThemeProvider } from '../../../providers/theme/theme';
import { WalletProvider } from '../../../providers/wallet/wallet';
import { WyreProvider } from '../../../providers/wyre/wyre';

interface CryptoOffer {
  showOffer: boolean;
  logoLight: string;
  logoDark: string;
  expanded: boolean;
  amountCost?: number;
  buyAmount?: number;
  fee?: number;
  fiatMoney?: string; // Rate without fees
  amountReceiving?: string;
  amountLimits?: any;
  errorMsg?: string;
  quoteData?: any; // Simplex
}
@Component({
  selector: 'page-crypto-offers',
  templateUrl: 'crypto-offers.html'
})
export class CryptoOffersPage {
  public wallet: any;
  public walletId: any;
  public coin: Coin;
  public paymentMethod: any;
  public selectedCountry;
  public currency: string;
  public amount: any;
  public fiatCurrency: any;
  public coinBorderColor: string;

  public offers: {
    simplex: CryptoOffer;
    wyre: CryptoOffer;
  } = {
    simplex: {
      amountReceiving: '0',
      showOffer: false,
      logoLight: 'assets/img/simplex/logo-simplex-color.svg',
      logoDark: 'assets/img/simplex/logo-simplex-dm.png',
      expanded: false
    },
    wyre: {
      amountReceiving: '0',
      showOffer: false,
      logoLight: 'assets/img/wyre/logo-wyre.svg',
      logoDark: 'assets/img/wyre/logo-wyre-dm.svg',
      expanded: false
    }
  };

  constructor(
    private appProvider: AppProvider,
    private buyCryptoProvider: BuyCryptoProvider,
    private logger: Logger,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private navParams: NavParams,
    private simplexProvider: SimplexProvider,
    private navCtrl: NavController,
    private profileProvider: ProfileProvider,
    private currencyProvider: CurrencyProvider,
    private configProvider: ConfigProvider,
    private walletProvider: WalletProvider,
    private wyreProvider: WyreProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private translate: TranslateService,
    private popupProvider: PopupProvider,
    public themeProvider: ThemeProvider
  ) {
    this.amount = this.navParams.data.amount;
    this.currency = this.navParams.data.currency;
    this.paymentMethod = this.navParams.data.paymentMethod;
    this.selectedCountry = this.navParams.data.selectedCountry;
    this.coin = this.navParams.data.coin;
    const coinColor =
      this.currencyProvider.getTheme(this.coin as Coin).coinColor || '#e6f8e9';
    this.coinBorderColor = `2px solid ${coinColor}`;
    this.walletId = this.navParams.data.walletId;
    this.wallet = this.profileProvider.getWallet(this.walletId);
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: CryptoOffersPage');
  }

  ionViewWillEnter() {
    this.setFiatCurrency();
    this.offers.simplex.showOffer = this.buyCryptoProvider.isPaymentMethodSupported(
      'simplex',
      this.paymentMethod,
      this.coin,
      this.currency
    );
    this.offers.wyre.showOffer = this.buyCryptoProvider.isPaymentMethodSupported(
      'wyre',
      this.paymentMethod,
      this.coin,
      this.currency
    );
    if (this.offers.simplex.showOffer) this.getSimplexQuote();
    if (this.offers.wyre.showOffer) this.getWyreQuote();
  }

  // GENERAL FUNCTIONS

  public expandCard(offer) {
    const key: string = offer.key;
    if (!offer.value || !offer.value.fiatMoney) return;
    if (this.offers[key]) {
      this.offers[key].expanded = this.offers[key].expanded ? false : true;
    }
  }

  public goTo(key: string) {
    switch (key) {
      case 'simplex':
        this.goToSimplexBuyPage();
        break;

      case 'wyre':
        this.goToWyreBuyPage();
        break;
    }
  }

  private setPrefix(address: string, coin: Coin, network: string): string {
    const prefix: string = this.currencyProvider.getProtocolPrefix(
      coin,
      network
    );
    const addr = `${prefix}:${address}`;
    return addr;
  }

  public openPopUpConfirmation(exchange: string, url?: string): void {
    this.onGoingProcessProvider.clear();

    let title, message;

    switch (exchange) {
      case 'simplex':
        title = this.translate.instant('Continue to Simplex');
        message = this.translate.instant(
          "In order to finish the payment process you will be redirected to Simplex's page"
        );
        break;

      case 'wyre':
        title = this.translate.instant('Continue to Wyre');
        message = this.translate.instant(
          "In order to finish the payment process you will be redirected to Wyre's page"
        );
        break;

      default:
        title = this.translate.instant('Continue to the exchange page');
        message = this.translate.instant(
          'In order to finish the payment process you will be redirected to the exchange page'
        );
        break;
    }

    const okText = this.translate.instant('Continue');
    const cancelText = this.translate.instant('Go back');
    this.popupProvider
      .ionicConfirm(title, message, okText, cancelText)
      .then((res: boolean) => {
        if (res) {
          switch (exchange) {
            case 'simplex':
              this.continueToSimplex();
              break;
            case 'wyre':
              this.externalLinkProvider.open(url);
              break;

            default:
              this.externalLinkProvider.open(url);
              break;
          }

          setTimeout(() => {
            this.navCtrl.popToRoot();
          }, 2500);
        }
      });
  }

  private setFiatCurrency() {
    if (this.currency === this.coin.toUpperCase()) {
      const config = this.configProvider.get();
      this.fiatCurrency = _.includes(
        this.simplexProvider.supportedFiatAltCurrencies,
        config.wallet.settings.alternativeIsoCode
      )
        ? config.wallet.settings.alternativeIsoCode
        : 'usd';
    } else {
      this.fiatCurrency = this.currency;
    }
  }

  public goToEdit(): void {
    this.navCtrl.pop();
  }

  public openExternalLink(url: string) {
    this.externalLinkProvider.open(url);
  }

  // SIMPLEX

  public goToSimplexBuyPage() {
    if (this.offers.simplex.errorMsg) return;
    this.openPopUpConfirmation('simplex');
  }

  public continueToSimplex(): void {
    this.walletProvider
      .getAddress(this.wallet, false)
      .then(address => {
        const quoteData = {
          quoteId: this.offers.simplex.quoteData.quote_id,
          currency: this.currency,
          fiatTotalAmount: this.offers.simplex.quoteData.fiat_money
            .total_amount,
          cryptoAmount: this.offers.simplex.quoteData.digital_money.amount
        };
        this.simplexProvider
          .simplexPaymentRequest(this.wallet, address, quoteData)
          .then(req => {
            if (req && req.error && !_.isEmpty(req.error)) {
              this.showSimplexError(req.error);
              return;
            }

            this.logger.debug('Simplex creating payment request: SUCCESS');

            const remoteData: any = {
              address,
              api_host: req.api_host,
              app_provider_id: req.app_provider_id,
              order_id: req.order_id,
              payment_id: req.payment_id
            };

            let newData = {
              address,
              created_on: Date.now(),
              crypto_amount: this.offers.simplex.quoteData.digital_money.amount,
              coin: this.wallet.coin.toUpperCase(),
              fiat_base_amount: this.offers.simplex.quoteData.fiat_money
                .base_amount,
              fiat_total_amount: this.offers.simplex.quoteData.fiat_money
                .total_amount,
              fiat_total_amount_currency: this.currency,
              order_id: req.order_id,
              payment_id: req.payment_id,
              status: 'paymentRequestSent',
              user_id: this.wallet.id
            };
            this.simplexProvider
              .saveSimplex(newData, null)
              .then(() => {
                this.logger.debug(
                  'Saved Simplex with status: ' + newData.status
                );
                const paymentUrl: string = this.simplexProvider.getPaymentUrl(
                  this.wallet,
                  quoteData,
                  remoteData
                );
                this.openExternalLink(paymentUrl);

                setTimeout(() => {
                  this.navCtrl.popToRoot();
                }, 2500);
              })
              .catch(err => {
                this.showSimplexError(err);
              });
          })
          .catch(err => {
            this.showSimplexError(err);
          });
      })
      .catch(err => {
        return this.showSimplexError(err);
      });
  }

  private getSimplexQuote(): void {
    this.logger.debug('Simplex getting quote');

    this.offers.simplex.amountLimits = this.simplexProvider.getFiatCurrencyLimits(
      this.fiatCurrency,
      this.coin
    );

    if (
      this.amount < this.offers.simplex.amountLimits.min ||
      this.amount > this.offers.simplex.amountLimits.max
    ) {
      this.offers.simplex.errorMsg = `The ${this.fiatCurrency} amount must be between ${this.offers.simplex.amountLimits.min} and ${this.offers.simplex.amountLimits.max}`;
      return;
    } else {
      let paymentMethod: string[] = [];
      switch (this.paymentMethod.method) {
        case 'sepaBankTransfer':
          paymentMethod.push('simplex_account');
          break;
        default:
          paymentMethod.push('credit_card');
          break;
      }
      const data = {
        digital_currency: this.wallet.coin.toUpperCase(),
        fiat_currency: this.fiatCurrency,
        requested_currency: this.fiatCurrency,
        requested_amount: this.amount,
        end_user_id: this.walletId,
        payment_methods: paymentMethod
      };

      this.simplexProvider
        .getQuote(this.wallet, data)
        .then(data => {
          if (data && data.quote_id) {
            this.offers.simplex.quoteData = data;
            this.offers.simplex.amountCost = data.fiat_money.total_amount;
            this.offers.simplex.buyAmount = data.fiat_money.base_amount;
            this.offers.simplex.fee =
              data.fiat_money.total_amount - data.fiat_money.base_amount;

            this.offers.simplex.fiatMoney = Number(
              this.offers.simplex.buyAmount / data.digital_money.amount
            ).toFixed(
              this.currencyProvider.getPrecision(this.coin).unitDecimals
            );
            this.offers.simplex.amountReceiving = data.digital_money.amount.toString();
            this.logger.debug('Simplex getting quote: SUCCESS');
          } else {
            if (data.message && _.isString(data.message)) {
              this.logger.error(data.message);
            }
            if (data.error && _.isString(data.error)) {
              this.logger.error(data.error);
            }
            let err = this.translate.instant(
              "Can't get rates at this moment. Please try again later"
            );
            this.showSimplexError(err);
          }
        })
        .catch(err => {
          this.logger.error('Simplex getting quote: FAILED');
          this.showSimplexError(err);
        });
    }
  }

  private showSimplexError(err?) {
    this.onGoingProcessProvider.clear();

    let msg = this.translate.instant(
      'Could not get crypto offer. Please, try again later.'
    );
    if (err) {
      if (_.isString(err)) {
        msg = err;
      } else {
        if (err.error && err.error.error) msg = err.error.error;
        else if (err.message) msg = err.message;
      }
    }

    this.logger.error('Simplex error: ' + msg);

    this.offers.simplex.errorMsg = msg;
  }

  // WYRE

  public goToWyreBuyPage() {
    if (this.offers.wyre.errorMsg) return;
    this.onGoingProcessProvider.set('processingOrderReservation');
    this.walletProvider
      .getAddress(this.wallet, false)
      .then(address => {
        let paymentMethod: string;
        switch (this.paymentMethod.method) {
          case 'applePay':
            paymentMethod = 'apple-pay';
            break;
          default:
            paymentMethod = 'debit-card';
            break;
        }
        const redirectUrl = this.appProvider.info.name + '://wyre';
        const failureRedirectUrl = this.appProvider.info.name + '://wyreError';
        const dest = this.setPrefix(address, this.coin, this.wallet.network);
        const data = {
          amount: this.amount.toString(),
          dest,
          destCurrency: this.coin.toUpperCase(),
          lockFields: ['dest', 'destCurrency'],
          paymentMethod,
          sourceCurrency: this.currency.toUpperCase()
        };

        this.wyreProvider
          .walletOrderReservation(this.wallet, data)
          .then(data => {
            if (
              data &&
              (data.exceptionId || (data.error && !_.isEmpty(data.error)))
            ) {
              this.showWyreError(data);
              return;
            }

            const url =
              data.url +
              '&redirectUrl=' +
              redirectUrl +
              '&failureRedirectUrl=' +
              failureRedirectUrl;
            this.openPopUpConfirmation('wyre', url);
          })
          .catch(err => {
            this.showWyreError(err);
          });
      })
      .catch(err => {
        this.showWyreError(err);
      });
  }

  private getWyreQuote(): void {
    this.logger.debug('Wyre getting quote');

    this.offers.wyre.amountLimits = this.wyreProvider.getFiatCurrencyLimits(
      this.fiatCurrency,
      this.coin,
      this.selectedCountry.shortCode
    );
    if (
      this.amount < this.offers.wyre.amountLimits.min ||
      this.amount > this.offers.wyre.amountLimits.max
    ) {
      this.offers.wyre.errorMsg = `The ${this.fiatCurrency} daily amount must be between ${this.offers.wyre.amountLimits.min} and ${this.offers.wyre.amountLimits.max}`;
      return;
    } else {
      this.walletProvider
        .getAddress(this.wallet, false)
        .then(address => {
          const dest = this.setPrefix(address, this.coin, this.wallet.network);
          const data = {
            amount: this.amount.toString(),
            sourceCurrency: this.currency.toUpperCase(),
            destCurrency: this.coin.toUpperCase(),
            dest,
            country: this.selectedCountry.shortCode
          };

          this.wyreProvider
            .walletOrderQuotation(this.wallet, data)
            .then((data: any) => {
              if (
                data &&
                (data.exceptionId || (data.error && !_.isEmpty(data.error)))
              ) {
                this.showWyreError(data);
                return;
              }

              this.offers.wyre.amountCost = data.sourceAmount; // sourceAmount = Total amount (including fees)
              this.offers.wyre.buyAmount = this.amount;
              this.offers.wyre.fee = data.sourceAmount - this.amount;

              this.offers.wyre.fiatMoney = Number(
                this.offers.wyre.buyAmount / data.destAmount
              ).toFixed(8);

              this.offers.wyre.amountReceiving = data.destAmount.toFixed(8);

              this.logger.debug('Wyre getting quote: SUCCESS');
            })
            .catch(err => {
              this.logger.error('Wyre getting quote: FAILED');
              this.showWyreError(err);
            });
        })
        .catch(err => {
          this.showWyreError(err);
        });
    }
  }

  private showWyreError(err?) {
    this.onGoingProcessProvider.clear();

    let msg = this.translate.instant(
      'Could not get crypto offer. Please, try again later.'
    );
    if (err) {
      if (_.isString(err)) {
        msg = err;
      } else if (err.exceptionId && err.message) {
        this.logger.error('Wyre error: ' + err.message);
        if (err.errorCode) {
          switch (err.errorCode) {
            case 'validation.unsupportedCountry':
              msg =
                this.translate.instant('Country not supported: ') +
                this.selectedCountry.name;
              break;
            default:
              msg = err.message;
              break;
          }
        } else msg = err.message;
      }
    }

    this.logger.error('Crypto offer error: ' + msg);
    this.offers.wyre.errorMsg = msg;
  }
}
