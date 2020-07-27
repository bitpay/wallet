import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';
import env from '../../../environments';

// Providers
import {
  ActionSheetProvider,
  Coin,
  ConfigProvider,
  CurrencyProvider,
  ErrorsProvider,
  Logger,
  ProfileProvider
} from '../../../providers';

// Pages
import { SelectCurrencyPage } from '../../../pages/add/select-currency/select-currency';
import { AmountPage } from '../../../pages/send/amount/amount';

@Component({
  selector: 'page-crypto-coin-selector',
  templateUrl: 'crypto-coin-selector.html'
})
export class CryptoCoinSelectorPage {
  public coins = [];
  private wallets;
  private wallet;

  constructor(
    private actionSheetProvider: ActionSheetProvider,
    private logger: Logger,
    private navCtrl: NavController,
    private profileProvider: ProfileProvider,
    private currencyProvider: CurrencyProvider,
    private translate: TranslateService,
    private configProvider: ConfigProvider,
    private errorsProvider: ErrorsProvider,
    private navParams: NavParams
  ) {
    this.wallets = this.profileProvider.getWallets({
      network: env.name == 'development' ? null : 'livenet',
      onlyComplete: true,
      coin: ['btc', 'bch', 'eth', 'xrp', 'pax', 'busd'],
      backedUp: true
    });
    const exchangeCoinsSupported = ['btc', 'bch', 'eth', 'xrp', 'pax', 'busd'];
    for (const coin of exchangeCoinsSupported) {
      const c = {
        unitCode: coin,
        name: this.currencyProvider.getCoinName(coin as Coin),
        availableWallets: _.filter(this.wallets, w => w.coin === coin)
      };
      this.coins.push(c);
    }
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: CryptoCoinSelectorPage');
  }

  ionViewWillEnter() {
    if (this.navParams.data.coin) {
      const coin = _.find(this.coins, ['unitCode', this.navParams.data.coin]);
      this.showWallets(coin);
    }
  }

  public showWallets(coin): void {
    const wallets = coin.availableWallets;
    if (_.isEmpty(wallets)) {
      this.errorsProvider.showNoWalletError(
        coin.unitCode.toUpperCase(),
        option => {
          if (option) {
            this.navCtrl.push(SelectCurrencyPage);
          }
        }
      );
    } else {
      const params = {
        wallets,
        selectedWalletId: null,
        title: this.translate.instant('Select wallet to deposit to')
      };
      const walletSelector = this.actionSheetProvider.createWalletSelector(
        params
      );
      walletSelector.present();
      walletSelector.onDidDismiss(wallet => {
        this.onWalletSelect(wallet);
      });
    }
  }

  private onWalletSelect(wallet): void {
    if (!_.isEmpty(wallet)) {
      this.wallet = wallet;
      this.goToAmountPage();
    }
  }

  private goToAmountPage() {
    this.navCtrl.push(AmountPage, {
      fromBuyCrypto: true,
      nextPage: 'CryptoPaymentMethodPage',
      walletId: this.wallet.id,
      currency: this.configProvider.get().wallet.settings.alternativeIsoCode
    });
  }
}
