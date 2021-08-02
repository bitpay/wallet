import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';
import * as _ from 'lodash';
import env from '../../../environments';

// Providers
import {
  ActionSheetProvider,
  BuyCryptoProvider,
  BwcErrorProvider,
  CurrencyProvider,
  ErrorsProvider,
  Logger,
  ProfileProvider
} from '../../../providers';

// Pages
import { SelectCurrencyPage } from '../../../pages/add/select-currency/select-currency';
import { RecoveryKeyPage } from '../../../pages/onboarding/recovery-key/recovery-key';
import { SendPage } from '../../../pages/send/send';
@Component({
  selector: 'page-crypto-coin-selector',
  templateUrl: 'crypto-coin-selector.html'
})
export class CryptoCoinSelectorPage {
  public coins = [];
  public useAsModal: boolean;
  public title: string;
  private wallets;
  private wallet;
  private fromFooterMenu: boolean;

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
    private navParams: NavParams,
    private bwcErrorProvider: BwcErrorProvider
  ) {
    // TODO: We temporarily remove Wyre from European Union countries. When the Simplex promotion ends we have to remove this condition
    const supportedCoins = this.navParams.data.isPromotionActiveForCountry
      ? this.buyCryptoProvider.getExchangeCoinsSupported('simplex')
      : this.buyCryptoProvider.getExchangeCoinsSupported();
    this.title = this.navParams.data.title;
    this.fromFooterMenu = this.navParams.data.fromFooterMenu;
    this.wallets = this.profileProvider.getWallets({
      network: env.name == 'development' ? null : 'livenet',
      onlyComplete: true,
      coin: supportedCoins,
      backedUp: true
    });
    for (const coin of supportedCoins) {
      const c = {
        unitCode: coin,
        name: this.currencyProvider.getCoinName(coin),
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
        title: this.title
          ? this.title
          : this.translate.instant('Select wallet to deposit to')
      };
      const walletSelector = this.actionSheetProvider.createWalletSelector(
        params
      );
      walletSelector.present();
      walletSelector.onDidDismiss(wallet => {
        if (wallet && wallet.needsBackup) {
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
        } else if (this.fromFooterMenu) {
          this.goToNextView(wallet);
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

  private goToNextView(wallet): void {
    if (!wallet) return;

    const action = this.navParams.data.action;
    const params = { wallet };

    if (action === 'receive') {
      const receiveModal = this.actionSheetProvider.createWalletReceive(params);
      receiveModal.present();
      receiveModal.onDidDismiss(data => {
        if (data) this.showErrorInfoSheet(data);
      });
    } else {
      this.navCtrl.push(SendPage, params);
    }
  }

  private showErrorInfoSheet(error: Error | string): void {
    const infoSheetTitle = this.translate.instant('Error');
    this.errorsProvider.showDefaultError(
      this.bwcErrorProvider.msg(error),
      infoSheetTitle
    );
  }
}
