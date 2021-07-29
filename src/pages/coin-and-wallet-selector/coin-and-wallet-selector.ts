import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';
import * as _ from 'lodash';
import env from '../../environments';

// Providers
import {
  ActionSheetProvider,
  // BuyCryptoProvider,
  BwcErrorProvider,
  CurrencyProvider,
  ErrorsProvider,
  Logger,
  ProfileProvider
} from '../../providers';

// Pages
import { SelectCurrencyPage } from '../../pages/add/select-currency/select-currency';
import { RecoveryKeyPage } from '../../pages/onboarding/recovery-key/recovery-key';
import { SendPage } from '../../pages/send/send';
@Component({
  selector: 'page-coin-and-wallet-selector',
  templateUrl: 'coin-and-wallet-selector.html'
})
export class CoinAndWalletSelectorPage {
  public coins = [];
  public useAsModal: boolean;
  public coinSelectorTitle: string;
  public walletSelectorTitle: string;
  private wallets;
  private wallet;
  private fromFooterMenu: boolean;
  public oneInchAllSupportedCoins: any[];
  public filteredTokens: any[];
  public tokensSearch: boolean;
  public searchQuery: string;

  private currentTokenListPage: number;
  private TOKEN_SHOW_LIMIT: number;
  public tokenListShowMore: boolean;

  public tokenSearchResults;
  public selectedToken;

  constructor(
    private actionSheetProvider: ActionSheetProvider,
    // private buyCryptoProvider: BuyCryptoProvider,
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
    const supportedCoins = this.navParams.data.supportedCoins
      ? this.navParams.data.supportedCoins
      : this.currencyProvider.getAvailableCoins();
    this.walletSelectorTitle = this.navParams.data.walletSelectorTitle;
    this.coinSelectorTitle = this.navParams.data.coinSelectorTitle
      ? this.navParams.data.coinSelectorTitle
      : this.translate.instant('Select Coin');
    this.fromFooterMenu = this.navParams.data.fromFooterMenu;
    this.oneInchAllSupportedCoins =
      this.navParams.data.oneInchAllSupportedCoins &&
      this.navParams.data.oneInchAllSupportedCoins.length > 0
        ? this.navParams.data.oneInchAllSupportedCoins
        : null;
    this.filteredTokens = _.clone(this.oneInchAllSupportedCoins);
    this.tokensSearch = false;
    this.tokenSearchResults = [];
    this.TOKEN_SHOW_LIMIT = 10;
    this.currentTokenListPage = 0;

    this.wallets = this.profileProvider.getWallets({
      network:
        env.name == 'development' && !this.navParams.data.onlyLivenet
          ? null
          : 'livenet',
      onlyComplete: true,
      coin: supportedCoins,
      backedUp: true
    });
    if (this.navParams.data.removeSpecificWalletId) {
      this.wallets = this.wallets.filter(
        w =>
          !w.needsBackup && w.id != this.navParams.data.removeSpecificWalletId
      );
    }
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
    this.logger.info('Loaded: CoinAndWalletSelectorPage');
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
        title: this.walletSelectorTitle
          ? this.walletSelectorTitle
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

  public showWalletsToLink(token): void {
    this.selectedToken = token;
    this.showPairedWalletSelector(token);
  }

  public showPairedWalletSelector(token) {
    const eligibleWallets = this.profileProvider.getWallets({
      keyId: this.navParams.data.keyId,
      network: 'livenet',
      onlyComplete: true,
      coin: 'eth',
      backedUp: true,
      m: 1,
      n: 1
    });

    const walletSelector = this.actionSheetProvider.createWalletSelector({
      wallets: eligibleWallets,
      title: this.translate.instant('Select an Ethereum Linked Wallet'),
      linkEthTokens: true,
      token
    });
    walletSelector.present();
    walletSelector.onDidDismiss(pairedWallet => {
      if (!_.isEmpty(pairedWallet) && token) {
        this.viewCtrl.dismiss({ selectedToken: token, wallet: pairedWallet });
      }
    });
  }

  public showTokensSearch() {
    this.tokensSearch = true;
    this.updateSearchInput('');
  }

  public hideTokensSearch() {
    this.tokensSearch = false;
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
    this.viewCtrl.dismiss({
      coin: this.wallet.coin,
      walletId: this.wallet.id,
      wallet: this.wallet
    });
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

  public updateSearchInput(search: string): void {
    this.throttleSearch(search);
  }

  private throttleSearch = _.throttle((search: string) => {
    this.tokenSearchResults = this.filter(search).slice(
      0,
      this.TOKEN_SHOW_LIMIT
    );
  }, 1000);

  private filter(search: string) {
    if (!search || search == '') {
      this.filteredTokens = _.clone(this.oneInchAllSupportedCoins);
    } else {
      this.filteredTokens = [];

      this.filteredTokens = this.oneInchAllSupportedCoins.filter(token => {
        return (
          token.name.toLowerCase().includes(search.toLowerCase()) ||
          token.symbol.toLowerCase().includes(search.toLowerCase()) ||
          token.address.toLowerCase().includes(search.toLowerCase())
        );
      });
    }

    this.tokenListShowMore =
      this.filteredTokens.length > this.TOKEN_SHOW_LIMIT ? true : false;

    return this.filteredTokens;
  }

  public moreSearchResults(loading): void {
    setTimeout(() => {
      this.currentTokenListPage++;
      this.showTokens();
      loading.complete();
    }, 1000);
  }

  public showTokens(): void {
    this.tokenSearchResults = this.filteredTokens
      ? this.filteredTokens.slice(
          0,
          (this.currentTokenListPage + 1) * this.TOKEN_SHOW_LIMIT
        )
      : [];
    this.tokenListShowMore =
      this.filteredTokens.length > this.tokenSearchResults.length;
  }

  public cleanSearch() {
    this.searchQuery = '';
    this.updateSearchInput('');
  }
}
