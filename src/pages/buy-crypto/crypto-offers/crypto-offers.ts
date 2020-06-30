import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';

// Providers
import { ConfigProvider } from '../../../providers/config/config';
import { Coin, CurrencyProvider } from '../../../providers/currency/currency';
import { Logger } from '../../../providers/logger/logger';
import { ProfileProvider } from '../../../providers/profile/profile';
import { SimplexProvider } from '../../../providers/simplex/simplex';

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
  public country: string;
  public currency: string;
  public currencies;
  public amount: any;
  public fiatCurrency: any;

  // Simplex
  public sFiatMoney;
  public sAmountReceiving;

  constructor(
    private logger: Logger,
    private navParams: NavParams,
    private simplexProvider: SimplexProvider,
    private navCtrl: NavController,
    private profileProvider: ProfileProvider,
    private currencyProvider: CurrencyProvider,
    private configProvider: ConfigProvider
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
    this.coin = this.navParams.data.coin;
    this.walletId = this.navParams.data.walletId;
    this.wallet = this.profileProvider.getWallet(this.walletId);
    this.setFiatCurrency();
    this.getSimplexQuote();
  }

  public goToSimplexBuyPage() {
    const params = {
      amount: this.amount,
      currency: this.currency,
      paymentMethod: this.paymentMethod,
      coin: this.coin,
      walletId: this.walletId
    };
    this.navCtrl.push(SimplexBuyPage, params);
  }

  private getSimplexQuote(): void {
    this.logger.debug('Simplex getting quote');

    const data = {
      digital_currency: this.wallet.coin.toUpperCase(),
      fiat_currency: this.fiatCurrency,
      requested_currency: this.wallet.coin.toUpperCase(),
      requested_amount: 1,
      end_user_id: this.walletId
    };

    this.simplexProvider
      .getQuote(this.wallet, data)
      .then(data => {
        if (data) {
          this.sFiatMoney = data.fiat_money;
          this.sAmountReceiving = Number(
            this.amount / this.sFiatMoney.total_amount
          ).toFixed(this.currencyProvider.getPrecision(this.coin).unitDecimals);
          this.logger.debug('Simplex getting quote: SUCCESS');
        }
      })
      .catch(err => {
        this.logger.error('Simplex getting quote FAILED: ' + err);
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
}
