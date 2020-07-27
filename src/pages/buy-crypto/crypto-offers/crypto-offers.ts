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
import { ProfileProvider } from '../../../providers/profile/profile';
import { SimplexProvider } from '../../../providers/simplex/simplex';
import { ThemeProvider } from '../../../providers/theme/theme';
import { WalletProvider } from '../../../providers/wallet/wallet';
import { WyreProvider } from '../../../providers/wyre/wyre';

// Pages
import { SimplexBuyPage } from '../../../pages/integrations/simplex/simplex-buy/simplex-buy';
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
  public country: string;
  public currency: string;
  public currencies;
  public amount: any;
  public fiatCurrency: any;

  // Simplex
  public sShowOffer: boolean;
  public sFiatMoney;
  public sAmountReceiving;
  public sAmountLimits;
  public sErrorMsg: string;

  // Wyre
  public wShowOffer: boolean;
  public wFiatMoney;
  public wAmountReceiving;
  public wAmountLimits;
  public wErrorMsg: string;

  constructor(
    private appProvider: AppProvider,
    private buyCryptoProvider: BuyCryptoProvider,
    private logger: Logger,
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
    this.sShowOffer = this.buyCryptoProvider.isPaymentMethodSupported(
      'simplex',
      this.paymentMethod,
      this.coin,
      this.currency
    );
    this.wShowOffer = this.buyCryptoProvider.isPaymentMethodSupported(
      'wyre',
      this.paymentMethod,
      this.coin,
      this.currency
    );
    if (this.sShowOffer) this.getSimplexQuote();
    if (this.wShowOffer) this.getWyreQuote();
  }

  public goToSimplexBuyPage() {
    if (this.sErrorMsg) return;
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
    if (this.wErrorMsg) return;
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
            this.goToWyrePage(url);
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

  private goToWyrePage(url: string) {
    const title = this.translate.instant('Continue to Wyre');
    const message = this.translate.instant(
      'In order to finish the payment process you will be redirected to Wyre page'
    );
    const okText = this.translate.instant('Continue');
    const cancelText = this.translate.instant('Go back');
    this.externalLinkProvider.open(
      url,
      true,
      title,
      message,
      okText,
      cancelText
    );
  }

  private getSimplexQuote(): void {
    this.logger.debug('Simplex getting quote');

    this.sAmountLimits = this.simplexProvider.getFiatCurrencyLimits(
      this.fiatCurrency,
      this.coin
    );

    if (
      this.amount < this.sAmountLimits.min ||
      this.amount > this.sAmountLimits.max
    ) {
      this.sErrorMsg = `The ${this.fiatCurrency} amount must be between ${
        this.sAmountLimits.min
      } and ${this.sAmountLimits.max}`;
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
            this.sAmountReceiving = data.digital_money.amount;
            this.sFiatMoney = Number(
              totalAmount / this.sAmountReceiving
            ).toFixed(
              this.currencyProvider.getPrecision(this.coin).unitDecimals
            );
            this.logger.debug('Simplex getting quote: SUCCESS');
          }
        })
        .catch(err => {
          this.logger.error('Simplex getting quote FAILED: ' + err);
        });
    }
  }

  private getWyreQuote(): void {
    this.wAmountLimits = this.wyreProvider.getFiatCurrencyLimits(
      this.fiatCurrency,
      this.coin
    );
    if (
      this.amount < this.wAmountLimits.min ||
      this.amount > this.wAmountLimits.max
    ) {
      this.wErrorMsg = `The ${this.fiatCurrency} daily amount must be between ${
        this.wAmountLimits.min
      } and ${this.wAmountLimits.max}`;
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

              this.wFiatMoney = Number(
                data.sourceAmount / data.destAmount
              ).toFixed(8); // sourceAmount = Total amount (including fees)

              this.wAmountReceiving = data.destAmount.toFixed(8);

              this.logger.debug('Wyre getting quote: SUCCESS');
            })
            .catch(err => {
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
    let msg = this.translate.instant(
      'Could not get crypto offer. Please, try again later.'
    );
    if (err) {
      if (_.isString(err)) {
        msg = err;
      } else if (err.exceptionId && err.message) {
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
    this.wErrorMsg = msg;
  }
}
