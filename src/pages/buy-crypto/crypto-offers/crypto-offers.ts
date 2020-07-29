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

// Pages
import { SimplexBuyPage } from '../../../pages/integrations/simplex/simplex-buy/simplex-buy';

interface CryptoOffer {
  showOffer: boolean;
  logoLight: string;
  logoDark: string;
  fiatMoney?: string;
  amountReceiving?: string;
  amountLimits?: any;
  errorMsg?: string;
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
  public currencies;
  public amount: any;
  public fiatCurrency: any;

  public offers: {
    simplex: CryptoOffer;
    wyre: CryptoOffer;
  } = {
    simplex: {
      amountReceiving: '0',
      showOffer: false,
      logoLight: 'assets/img/simplex/logo-simplex-color.svg',
      logoDark: 'assets/img/simplex/logo-simplex-dm.png'
    },
    wyre: {
      amountReceiving: '0',
      showOffer: false,
      logoLight: 'assets/img/wyre/logo-wyre.svg',
      logoDark: 'assets/img/wyre/logo-wyre-dm.svg'
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
    this.currencies = this.simplexProvider.supportedCoins;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: CryptoOffersPage');
  }

  ionViewWillEnter() {
    this.amount = this.navParams.data.amount;
    this.currency = this.navParams.data.currency;
    this.paymentMethod = this.navParams.data.paymentMethod;
    this.selectedCountry = this.navParams.data.selectedCountry;
    this.coin = this.navParams.data.coin;
    this.walletId = this.navParams.data.walletId;
    this.wallet = this.profileProvider.getWallet(this.walletId);
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

  public goToSimplexBuyPage() {
    if (this.offers.simplex.errorMsg) return;
    const params = {
      amount: this.amount,
      currency: this.currency,
      paymentMethod: this.paymentMethod,
      coin: this.coin,
      walletId: this.walletId
    };
    this.navCtrl.push(SimplexBuyPage, params);
  }

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
          lockFields: ['dest'],
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
            this.openWyrePopUpConfirmation(url);
          })
          .catch(err => {
            this.showWyreError(err);
          });
      })
      .catch(err => {
        this.showWyreError(err);
      });
  }

  private setPrefix(address: string, coin: Coin, network: string): string {
    const prefix: string = this.currencyProvider.getProtocolPrefix(
      coin,
      network
    );
    const addr = `${prefix}:${address}`;
    return addr;
  }

  public openWyrePopUpConfirmation(url: string): void {
    this.onGoingProcessProvider.clear();
    const title = this.translate.instant('Continue to Wyre');
    const message = this.translate.instant(
      'In order to finish the payment process you will be redirected to Wyre page'
    );
    const okText = this.translate.instant('Continue');
    const cancelText = this.translate.instant('Go back');
    this.popupProvider
      .ionicConfirm(title, message, okText, cancelText)
      .then((res: boolean) => {
        if (res) {
          this.externalLinkProvider.open(url);
          setTimeout(() => {
            this.navCtrl.popToRoot();
          }, 2500);
        }
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
      this.offers.simplex.errorMsg = `The ${
        this.fiatCurrency
      } amount must be between ${this.offers.simplex.amountLimits.min} and ${
        this.offers.simplex.amountLimits.max
      }`;
      return;
    } else {
      const data = {
        digital_currency: this.wallet.coin.toUpperCase(),
        fiat_currency: this.fiatCurrency,
        requested_currency: this.fiatCurrency,
        requested_amount: this.amount,
        end_user_id: this.walletId
      };

      this.simplexProvider
        .getQuote(this.wallet, data)
        .then(data => {
          if (data) {
            const totalAmount = data.fiat_money.total_amount;
            this.offers.simplex.fiatMoney = Number(
              totalAmount / data.digital_money.amount
            ).toFixed(
              this.currencyProvider.getPrecision(this.coin).unitDecimals
            );
            this.offers.simplex.amountReceiving = data.digital_money.amount.toString();
            this.logger.debug('Simplex getting quote: SUCCESS');
          }
        })
        .catch(err => {
          this.logger.error('Simplex getting quote FAILED: ' + err);
        });
    }
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
      this.offers.wyre.errorMsg = `The ${
        this.fiatCurrency
      } daily amount must be between ${this.offers.wyre.amountLimits.min} and ${
        this.offers.wyre.amountLimits.max
      }`;
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

              this.offers.wyre.fiatMoney = Number(
                data.sourceAmount / data.destAmount
              ).toFixed(8); // sourceAmount = Total amount (including fees)

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
              msg = this.translate.instant(
                `Country not supported: ${this.selectedCountry.name}`
              );
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
