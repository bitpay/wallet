import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';
import * as _ from 'lodash';
import env from '../../../environments';

// Providers
import {
  ActionSheetProvider,
  BuyCryptoProvider,
  Coin,
  CurrencyProvider,
  ErrorsProvider,
  Logger,
  ProfileProvider
} from '../../../providers';

// Pages
import { SelectCurrencyPage } from '../../../pages/add/select-currency/select-currency';
import { RecoveryKeyPage } from '../../../pages/onboarding/recovery-key/recovery-key';
@Component({
  selector: 'page-crypto-coin-selector',
  templateUrl: 'crypto-coin-selector.html'
})
export class CryptoCoinSelectorPage {
  public coins = [];
  public useAsModal: boolean;
  private wallets;
  private wallet;

  constructor(
    private actionSheetProvider: ActionSheetProvider,
    private buyCryptoProvider: BuyCryptoProvider,
    private logger: Logger,
    private navCtrl: NavController,
    private viewCtrl: ViewController,
    private profileProvider: ProfileProvider,
    private currencyProvider: CurrencyProvider,
    private translate: TranslateService,
    private errorsProvider: ErrorsProvider,
    private navParams: NavParams
  ) {
    const supportedCoins = this.buyCryptoProvider.exchangeCoinsSupported;
    this.wallets = this.profileProvider.getWallets({
      network: env.name == 'development' ? null : 'livenet',
      onlyComplete: true,
      coin: supportedCoins,
      backedUp: true
    });
    for (const coin of supportedCoins) {
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
    this.useAsModal = this.navParams.data.useAsModal;
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
        if (wallet.needsBackup) {
          const infoSheet = this.actionSheetProvider.createInfoSheet(
            'key-verification-required'
          );
          infoSheet.present();
          infoSheet.onDidDismiss(option => {
            if (option) {
              this.navCtrl.push(RecoveryKeyPage, {
                keyId: wallet.keyId
              });
            }
          });
        } else {
          this.onWalletSelect(wallet);
        }
      });
    }
  }

  private onWalletSelect(wallet): void {
    if (!_.isEmpty(wallet)) {
      this.wallet = wallet;
      this.save();
    }
  }

  public close() {
    this.viewCtrl.dismiss();
  }

  private save() {
    this.viewCtrl.dismiss({ coin: this.wallet.coin, walletId: this.wallet.id });
  }
}
