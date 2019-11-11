import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  Events,
  ModalController,
  NavController,
  NavParams
} from 'ionic-angular';
import * as _ from 'lodash';

// pages
import { ImportWalletPage } from '../../add/import-wallet/import-wallet';
import { WalletGroupOnboardingPage } from '../../settings/wallet-group-settings/wallet-group-onboarding/wallet-group-onboarding';
import { CreateWalletPage } from '../create-wallet/create-wallet';

// providers
import {
  ActionSheetProvider,
  BwcErrorProvider,
  Logger,
  OnGoingProcessProvider,
  PersistenceProvider,
  PopupProvider,
  ProfileProvider,
  PushNotificationsProvider,
  WalletProvider
} from '../../../providers';
import {
  Coin,
  CoinsMap,
  CurrencyProvider
} from '../../../providers/currency/currency';
import { Token } from '../../../providers/currency/token';

@Component({
  selector: 'page-select-currency',
  templateUrl: 'select-currency.html'
})
export class SelectCurrencyPage {
  private showKeyOnboarding: boolean;

  public wallets;
  public walletsEth;
  public title: string;
  public coin: Coin;
  public coinsSelected = {} as CoinsMap<boolean>;
  public tokensSelected = {} as CoinsMap<boolean>;
  public availableChains: string[];
  public availableTokens: Token[];
  public isOnboardingFlow: boolean;
  public isZeroState: boolean;

  constructor(
    private actionSheetProvider: ActionSheetProvider,
    private currencyProvider: CurrencyProvider,
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
    private popupProvider: PopupProvider,
    private modalCtrl: ModalController,
    private persistenceProvider: PersistenceProvider
  ) {
    this.availableChains = this.navParam.data.isShared
      ? this.currencyProvider.getMultiSigCoins()
      : this.currencyProvider.getAvailableChains();
    this.availableTokens = this.currencyProvider.getAvailableTokens();
    for (const chain of this.availableChains) {
      this.coinsSelected[chain] = true;
    }
    for (const token of this.availableTokens) {
      this.tokensSelected[token.symbol] = false;
    }
    this.shouldShowKeyOnboarding();
    this.setWallets();
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: SelectCurrencyPage');
    this.isOnboardingFlow = this.navParam.data.isOnboardingFlow;
    this.isZeroState = this.navParam.data.isZeroState;
    this.title = this.isZeroState
      ? this.translate.instant('Select currencies')
      : this.translate.instant('Select currency');
  }

  private shouldShowKeyOnboarding() {
    this.persistenceProvider.getKeyOnboardingFlag().then(value => {
      if (!value) {
        this.showKeyOnboarding = true;
        const wallets = this.profileProvider.getWallets();
        const walletsGroups = _.values(_.groupBy(wallets, 'keyId'));
        walletsGroups.forEach((walletsGroup: any) => {
          if (walletsGroup[0].canAddNewAccount) this.showKeyOnboarding = false;
        });
      } else {
        this.showKeyOnboarding = false;
      }
    });
  }

  private showKeyOnboardingSlides(coins: Coin[]) {
    this.logger.debug('Showing key onboarding');
    const modal = this.modalCtrl.create(WalletGroupOnboardingPage, null, {
      showBackdrop: false,
      enableBackdropDismiss: false
    });
    modal.present();
    modal.onDidDismiss(() => {
      this._createWallet(coins);
    });
    this.persistenceProvider.setKeyOnboardingFlag();
  }

  public goToCreateWallet(coin: string): void {
    this.navCtrl.push(CreateWalletPage, {
      isShared: this.navParam.data.isShared,
      coin,
      keyId: this.navParam.data.keyId,
      showKeyOnboarding: this.showKeyOnboarding
    });
  }

  public getCoinName(coin: Coin): string {
    return this.currencyProvider.getCoinName(coin);
  }

  public goToImportWallet(): void {
    this.navCtrl.push(ImportWalletPage);
  }

  public createWallet(coins: Coin[]): void {
    if (this.showKeyOnboarding) {
      this.showKeyOnboardingSlides(coins);
      return;
    }
    this._createWallet(coins);
  }

  private _createWallet(coins: Coin[]): void {
    const selectedCoins = _.keys(_.pickBy(this.coinsSelected)) as Coin[];
    coins = coins || selectedCoins;
    const selectedTokens = _.keys(_.pickBy(this.tokensSelected));
    this.onGoingProcessProvider.set('creatingWallet');
    this.profileProvider
      .createDefaultWallet(coins)
      .then(wallets => {
        this.walletProvider.updateRemotePreferences(wallets);
        this.pushNotificationsProvider.updateSubscription(wallets);
        for (const wallet of wallets) {
          if (wallet.coin === 'eth' && selectedTokens.length > 0) {
            this.createTokenWallet(wallet, selectedTokens);
          } else {
            return this.endProcess();
          }
        }
      })
      .catch(e => {
        this.showError(e);
      });
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

  private endProcess() {
    this.onGoingProcessProvider.clear();
    this.navCtrl.popToRoot().then(() => {
      this.events.publish('Local/WalletListChange');
    });
  }

  // Tokens
  public setWallets(): void {
    this.wallets = this.navParam.data.keyId
      ? this.profileProvider.getWalletsFromGroup({
          keyId: this.navParam.data.keyId,
          network: 'livenet'
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

    const walletSelector = this.actionSheetProvider.createInfoSheet(
      'addTokenWallet',
      {
        wallets: availableWallets,
        token
      }
    );
    walletSelector.present();
    walletSelector.onDidDismiss(wallet => {
      if (wallet == 'newWallet') {
        this.tokensSelected[token.symbol] = true;
        return this.createWallet([Coin.ETH]);
      } else if (!_.isEmpty(wallet) && wallet !== 'newWallet') {
        return this.addTokenWallet(wallet, token);
      }
    });
  }

  private async addTokenWallet(wallet, token) {
    const { name, symbol } = token;
    const { credentials } = _.cloneDeep(wallet);
    credentials.walletName = name;
    credentials.coin = symbol.toLowerCase();
    credentials.token = token;
    await this.profileProvider.loadAndBindProfile(credentials);
    this.endProcess();
  }

  private createTokenWallet(wallet, selectedTokens) {
    const addTokens = this.availableTokens.filter(token =>
      selectedTokens.includes(token.symbol)
    );
    for (const token of addTokens) {
      this.addTokenWallet(wallet, token);
    }
  }
}
