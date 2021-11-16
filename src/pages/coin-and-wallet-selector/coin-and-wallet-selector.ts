import { Component, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  Content,
  Events,
  NavController,
  NavParams,
  ViewController
} from 'ionic-angular';
import * as _ from 'lodash';
import env from '../../environments';

// Providers
import {
  ActionSheetProvider,
  BwcErrorProvider,
  CurrencyProvider,
  ErrorsProvider,
  Logger,
  ProfileProvider,
  WalletProvider
} from '../../providers';

// Pages
import { CreateWalletPage } from '../../pages/add/create-wallet/create-wallet';
import { RecoveryKeyPage } from '../../pages/onboarding/recovery-key/recovery-key';
import { SendPage } from '../../pages/send/send';
@Component({
  selector: 'page-coin-and-wallet-selector',
  templateUrl: 'coin-and-wallet-selector.html'
})
export class CoinAndWalletSelectorPage {
  @ViewChild('pageTop') pageTop: Content;

  public coins: any[] = [];
  public chains: any[] = [];
  public tokens: any[] = [];

  public useAsModal: boolean;
  public coinSelectorTitle: string;
  public walletSelectorTitle: string;
  private wallets;
  private wallet;
  private fromFooterMenu: boolean;
  public oneInchAllSupportedCoins: any[];
  public showOneInchTokensSearchBtn: boolean;
  public filteredTokens: any[];
  public tokensSearch: boolean;
  public searchQuery: string;

  private currentTokenListPage: number;
  private TOKEN_SHOW_LIMIT: number;
  public tokenListShowMore: boolean;

  public tokenSearchResults;
  public selectedToken;

  public popularTokensPosition: number;
  public otherTokensPosition: number;

  constructor(
    private actionSheetProvider: ActionSheetProvider,
    private logger: Logger,
    private navCtrl: NavController,
    private viewCtrl: ViewController,
    private profileProvider: ProfileProvider,
    public currencyProvider: CurrencyProvider,
    private translate: TranslateService,
    private errorsProvider: ErrorsProvider,
    private navParams: NavParams,
    private bwcErrorProvider: BwcErrorProvider,
    private walletProvider: WalletProvider,
    private events: Events
  ) {
    const supportedCoins = this.navParams.data.supportedCoins
      ? this.navParams.data.supportedCoins
      : this.currencyProvider.getAvailableCoins();

    const supportedChains = _.intersection(
      this.currencyProvider.getAvailableChains(),
      supportedCoins
    );

    const supportedTokens = _.intersection(
      this.currencyProvider
        .getAvailableTokens()
        .map(({ symbol }) => symbol.toLowerCase()),
      supportedCoins
    );

    this.walletSelectorTitle = this.navParams.data.walletSelectorTitle;
    this.coinSelectorTitle = this.navParams.data.coinSelectorTitle
      ? this.navParams.data.coinSelectorTitle
      : this.translate.instant('Select Coin');
    this.fromFooterMenu = this.navParams.data.fromFooterMenu;
    this.oneInchAllSupportedCoins =
      this.navParams.data.oneInchAllSupportedCoins &&
      this.navParams.data.oneInchAllSupportedCoins.length > 0
        ? _.orderBy(this.navParams.data.oneInchAllSupportedCoins, 'name')
        : null;
    this.showOneInchTokensSearchBtn = this.navParams.data.showOneInchTokensSearchBtn;
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
      coin: supportedCoins
    });
    if (this.navParams.data.removeSpecificWalletId) {
      this.wallets = this.wallets.filter(
        w => w.id != this.navParams.data.removeSpecificWalletId
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

    for (const coin of supportedChains) {
      const c = {
        unitCode: coin,
        name: this.currencyProvider.getCoinName(coin),
        availableWallets: _.filter(this.wallets, w => w.coin === coin)
      };
      this.chains.push(c);
    }

    for (const coin of supportedTokens) {
      const availableWallets: any[] = _.filter(
        this.wallets,
        w => w.coin === coin
      );
      if (
        !this.currencyProvider.isCustomERCToken(coin) ||
        (this.currencyProvider.isCustomERCToken(coin) &&
          availableWallets.length > 0)
      ) {
        const c = {
          unitCode: coin,
          name: this.currencyProvider.getCoinName(coin),
          availableWallets
        };
        this.tokens.push(c);
      }
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
      if (this.currencyProvider.isERCToken(coin.unitCode.toLowerCase())) {
        this.logger.debug(
          'No wallets available for this ERCToken: ' + coin.unitCode
        );
        const tokens = this.currencyProvider.getAvailableTokens();
        const token = tokens.find(x => x.symbol == coin.unitCode.toUpperCase());
        this.showPairedWalletSelector(token, true);
      } else {
        this.errorsProvider.showNoWalletError(
          coin.unitCode.toUpperCase(),
          option => {
            if (option) {
              this.navCtrl.push(CreateWalletPage, {
                isShared: false,
                coin: coin.unitCode,
                fromCoinAndWalletSelector: true
              });
            }
          }
        );
      }
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

  public showPairedWalletSelector(token, shouldCreateWallet?: boolean) {
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
        if (shouldCreateWallet) {
          if (
            !_.isEmpty(pairedWallet) &&
            !_.isEmpty(token) &&
            token.symbol.toLowerCase() != 'eth' &&
            pairedWallet.coin == 'eth' &&
            token.symbol.toLowerCase() != pairedWallet.coin
          ) {
            this.createAndBindTokenWallet(pairedWallet, token).then(
              newWallet => {
                this.walletProvider.updateRemotePreferences(pairedWallet);
                this.events.publish('Local/FetchWallets');
                this.onWalletSelect(newWallet);
              }
            );
          }
        } else {
          this.viewCtrl.dismiss({ selectedToken: token, wallet: pairedWallet });
        }
      }
    });
  }

  private createAndBindTokenWallet(pairedWallet, token): Promise<any> {
    if (this.currencyProvider.isCustomERCToken(token.symbol.toLowerCase())) {
      const _token = this.currencyProvider
        .getAvailableCustomTokens()
        .filter(t => {
          return t.symbol.toLowerCase() == token.symbol.toLowerCase();
        });

      if (_token.length > 0) token = _token[0];

      if (!token.decimals)
        return Promise.reject('Cannot create token wallet. Missing decimals');

      const customToken = {
        keyId: pairedWallet.keyId,
        name: token.name,
        address: token.address,
        logoURI: token.logoURI,
        symbol: token.symbol.toLowerCase(),
        decimals: token.decimals
      };

      return this.profileProvider.createCustomTokenWallet(
        pairedWallet,
        customToken
      );
    } else {
      return this.profileProvider.createTokenWallet(pairedWallet, token);
    }
  }

  public showTokensSearch() {
    this.tokensSearch = true;
    this.pageTop.scrollToTop();
    this.updateSearchInput('');
  }

  public hideTokensSearch() {
    this.tokensSearch = false;
    this.pageTop.scrollToTop();
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
    this.currentTokenListPage = 0;
    this.throttleSearch(search);
  }

  private throttleSearch = _.throttle((search: string) => {
    this.tokenSearchResults = this.filter(search).slice(
      0,
      this.TOKEN_SHOW_LIMIT
    );
  }, 1000);

  private filter(search: string) {
    this.filteredTokens = [];
    let exactResult,
      filteredPopularTokens,
      filteredTokens: any[] = [];

    exactResult = this.oneInchAllSupportedCoins.filter(token => {
      return (
        token.symbol.toLowerCase() == search.toLowerCase() ||
        token.name.toLowerCase() == search.toLowerCase() ||
        token.address.toLowerCase() == search.toLowerCase()
      );
    });
    filteredPopularTokens = this.oneInchAllSupportedCoins.filter(token => {
      return (
        this.currencyProvider.getPopularErc20Tokens().includes(token.symbol) &&
        (token.name.toLowerCase().includes(search.toLowerCase()) ||
          token.symbol.toLowerCase().includes(search.toLowerCase()))
      );
    });
    filteredTokens = this.oneInchAllSupportedCoins.filter(token => {
      return (
        !this.currencyProvider.getPopularErc20Tokens().includes(token.symbol) &&
        (token.name.toLowerCase().includes(search.toLowerCase()) ||
          token.symbol.toLowerCase().includes(search.toLowerCase()))
      );
    });

    if (filteredPopularTokens.length > 0) {
      if (exactResult[0]) {
        if (
          this.currencyProvider
            .getPopularErc20Tokens()
            .includes(exactResult[0].symbol)
        ) {
          this.popularTokensPosition = 0;
          this.otherTokensPosition = filteredPopularTokens.length;
        } else {
          this.popularTokensPosition = 1;
          this.otherTokensPosition = filteredPopularTokens.length + 1;
        }
      } else {
        this.popularTokensPosition = 0;
        this.otherTokensPosition = filteredPopularTokens.length;
      }
    } else {
      this.popularTokensPosition = null;
      this.otherTokensPosition = null;
    }

    this.filteredTokens = [
      ...new Set([...exactResult, ...filteredPopularTokens, ...filteredTokens])
    ];

    this.tokenListShowMore =
      this.filteredTokens.length > this.TOKEN_SHOW_LIMIT ? true : false;

    return this.filteredTokens;
  }

  public moreSearchResults(loading): void {
    setTimeout(() => {
      this.currentTokenListPage++;
      this.showTokens();
      loading.complete();
    }, 100);
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
