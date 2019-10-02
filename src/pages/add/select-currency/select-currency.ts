import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Events, NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';

// pages
import { ImportWalletPage } from '../../add/import-wallet/import-wallet';
import { CreateWalletPage } from '../create-wallet/create-wallet';
import { TokenMap } from './token-map';

// providers
import {
  ActionSheetProvider,
  BwcErrorProvider,
  Logger,
  OnGoingProcessProvider,
  PopupProvider,
  ProfileProvider,
  PushNotificationsProvider,
  WalletProvider
} from '../../../providers';
import { UTXO_COINS } from '../../../providers/wallet/wallet';

@Component({
  selector: 'page-select-currency',
  templateUrl: 'select-currency.html'
})
export class SelectCurrencyPage {
  public wallets;
  public walletsEth;
  public title: string;
  public coin: string;
  public isOnboardingFlow: boolean;
  public coinsSelected;
  public tokensSelected;
  public tokenList;
  private tokenMap = TokenMap;

  constructor(
    private actionSheetProvider: ActionSheetProvider,
    private navCtrl: NavController,
    private logger: Logger,
    private navParam: NavParams,
    private profileProvider: ProfileProvider,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private walletProvider: WalletProvider,
    private pushNotificationsProvider: PushNotificationsProvider,
    private bwcErrorProvider: BwcErrorProvider,
    private translate: TranslateService,
    private events: Events,
    private popupProvider: PopupProvider
  ) {
    this.coinsSelected = {
      btc: true,
      bch: true,
      eth: true
    };
    this.tokensSelected = {
      usdc: false,
      pax: false,
      gusd: false
    };
    this.tokenList = Object.keys(this.tokenMap).map(
      token => this.tokenMap[token]
    );
    this.setWallets();
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: SelectCurrencyPage');
    this.isOnboardingFlow =
      this.navCtrl.getPrevious().name === 'HomePage' ? true : false;
    this.title = this.isOnboardingFlow
      ? this.translate.instant('Select currencies')
      : this.translate.instant('Select currency');
  }

  public goToCreateWallet(coin: string): void {
    this.navCtrl.push(CreateWalletPage, {
      isShared: this.navParam.data.isShared,
      coin,
      keyId: this.navParam.data.keyId
    });
  }

  public goToImportWallet(): void {
    this.navCtrl.push(ImportWalletPage);
  }

  public setWallets(): void {
    this.wallets = this.navParam.data.keyId
      ? this.profileProvider.getWalletsFromGroup({
        keyId: this.navParam.data.keyId
      })
      : [];
    this.walletsEth = this.wallets.filter(wallet => wallet.coin == 'eth');
  }

  public showWalletSelector(token) {
    const tokenWalletIds = this.wallets
      .filter(wallet => wallet.coin === token.symbol.toLowerCase())
      .map(wallet => wallet.id);
    const availableWallets = this.wallets.filter(
      wallet =>
        !tokenWalletIds.includes(`${wallet.id}-${token.address}`) &&
        wallet.coin === 'eth'
    );
    // 1 ETH wallet only
    if (availableWallets.length === 1) {
      this.addTokenWallet(availableWallets[0], token);
    } else {
      const walletSelector = this.actionSheetProvider.createInfoSheet(
        'addTokenWallet',
        {
          wallets: availableWallets
        }
      );
      walletSelector.present();
      walletSelector.onDidDismiss(wallet => {
        if (!_.isEmpty(wallet)) this.addTokenWallet(wallet, token);
      });
    }
  }

  private async addTokenWallet(wallet, token) {
    const { name, symbol } = token;
    const { credentials } = _.cloneDeep(wallet);
    credentials.walletName = name;
    credentials.coin = symbol.toLowerCase();
    credentials.token = token;
    await this.profileProvider.loadAndBindProfile(credentials);
    this.endProcess(wallet);
  }

  private createTokenWallet(wallet, selectedTokens) {
    const addTokens = this.tokenList.filter(token =>
      selectedTokens.includes(token.symbol.toLowerCase())
    );
    for (const token of addTokens) {
      this.addTokenWallet(wallet, token);
    }
  }

  public createWallet(coins: string[]): void {
    coins = _.keys(_.pickBy(this.coinsSelected));
    const selectedTokens = _.keys(_.pickBy(this.tokensSelected));
    const opts = {
      coin: coins[0],
      singleAddress: UTXO_COINS[coins[0].toUpperCase()] ? false : true
    };
    this.onGoingProcessProvider.set('creatingWallet');
    this.createDefaultWallet(false, opts)
      .then(wallet => {
        if (wallet.coin === 'eth' && selectedTokens) {
          this.createTokenWallet(wallet, selectedTokens);
        }
        if (coins.length === 1) this.endProcess(wallet);
        else {
          const promises = [];
          const keyId = wallet.credentials.keyId;
          coins.slice(1).forEach(coin => {
            const opts = {
              keyId,
              coin,
              singleAddress: UTXO_COINS[coin.toUpperCase()] ? false : true
            };
            promises.push(this.createDefaultWallet(true, opts));
          });
          Promise.all(promises)
            .then(wallets =>
              wallets.forEach(wallet => {
                if (wallet.coin === 'eth' && selectedTokens) {
                  this.createTokenWallet(wallet, selectedTokens);
                }
                this.endProcess(wallet);
              })
            )
            .catch(err => this.showError(err));
        }
      })
      .catch(err => this.showError(err));
  }

  private createDefaultWallet(addingNewWallet, opts) {
    return this.profileProvider.createDefaultWallet(addingNewWallet, opts);
  }

  private showError(err) {
    this.onGoingProcessProvider.clear();
    if (
      err &&
      err.message != 'FINGERPRINT_CANCELLED' &&
      err.message != 'PASSWORD_CANCELLED'
    ) {
      this.logger.error('Create: could not create wallet', err);
      const title = this.translate.instant('Error');
      err = this.bwcErrorProvider.msg(err);
      this.popupProvider.ionicAlert(title, err);
    }
    return;
  }

  private endProcess(wallet) {
    this.walletProvider.updateRemotePreferences(wallet);
    this.pushNotificationsProvider.updateSubscription(wallet);
    this.onGoingProcessProvider.clear();
    this.navCtrl.popToRoot().then(() => {
      this.events.publish('Local/WalletListChange');
    });
  }
}
