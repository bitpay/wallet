import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  Events,
  ModalController,
  NavController,
  NavParams,
  ViewController
} from 'ionic-angular';
import * as _ from 'lodash';

// Providers
import { animate, style, transition, trigger } from '@angular/animations';
import { CurrencyProvider, OnGoingProcessProvider } from '../../../providers';
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { ProfileProvider } from '../../../providers/profile/profile';
import { WalletProvider } from '../../../providers/wallet/wallet';
import { AddCustomTokenModalPage } from './add-custom-token-modal/add-custom-token-modal';
import { ConfirmAddTokenModalPage } from './confirm-add-token-modal/confirm-add-token-modal';
@Component({
  selector: 'page-custom-token',
  templateUrl: 'custom-token.html',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({
          opacity: 0
        }),
        animate('300ms')
      ])
    ])
  ]
})
export class CustomTokenPage {
  public pairedWallet: any;
  public keyId: string;
  public isOpenSelector: boolean;
  public customTokenForm: FormGroup;
  public isValid: boolean;

  private currentTokenListPage: number;
  private TOKEN_SHOW_LIMIT: number;
  public tokenListShowMore: boolean;

  public tokenSearchResults;
  public filteredTokens;
  public popularTokensPosition: number;
  public otherTokensPosition: number;
  public searchQuery;
  public availableCustomTokens;
  public invoiceWarning;

  constructor(
    private profileProvider: ProfileProvider,
    private actionSheetProvider: ActionSheetProvider,
    private navParams: NavParams,
    private fb: FormBuilder,
    private walletProvider: WalletProvider,
    private navCtrl: NavController,
    private events: Events,
    private modalCtrl: ModalController,
    public currencyProvider: CurrencyProvider,
    private viewCtrl: ViewController,
    private onGoingProcessProvider: OnGoingProcessProvider
  ) {
    this.keyId = this.navParams.get('keyId');
    this.customTokenForm = this.fb.group({
      tokenName: [null, Validators.required],
      tokenAddress: [null, Validators.required],
      tokenSymbol: [null, Validators.required],
      tokenDecimals: [null, Validators.required]
    });
    this.tokenSearchResults = this.filteredTokens;
    this.TOKEN_SHOW_LIMIT = 10;
    this.currentTokenListPage = 0;
    const bitpaySupportedTokens: string[] = this.currencyProvider
      .getBitpaySupportedTokens()
      .map(token => token.symbol.toLowerCase());
    this.availableCustomTokens = _.orderBy(
      this.currencyProvider.getAvailableCustomTokens(),
      'name'
    ).filter(token => {
      return !['eth', ...bitpaySupportedTokens].includes(
        token.symbol.toLowerCase()
      );
    });
    this.updateSearchInput('');
    this.showInvoiceWarning();
    this.showPairedWalletSelector();
  }

  public showPairedWalletSelector() {
    this.isOpenSelector = true;
    const eligibleWallets = this.keyId
      ? this.profileProvider.getWalletsFromGroup({
          keyId: this.keyId,
          coin: 'eth',
          m: 1,
          n: 1
        })
      : [];

    if (eligibleWallets.length === 1) {
      this.pairedWallet = eligibleWallets[0];
    } else {
      const walletSelector = this.actionSheetProvider.createInfoSheet(
        'linkEthWallet',
        {
          wallets: eligibleWallets,
          customToken: true
        }
      );
      walletSelector.present();
      walletSelector.onDidDismiss(pairedWallet => {
        this.isOpenSelector = false;
        if (!_.isEmpty(pairedWallet)) {
          this.pairedWallet = pairedWallet;
        } else {
          this.invoiceWarning.dismiss();
          this.close();
        }
      });
    }
  }

  public createAndBindTokenWallet(customToken) {
    this.onGoingProcessProvider.set('Adding token');
    this.profileProvider
      .createCustomTokenWallet(this.pairedWallet, customToken)
      .then(() => {
        // store preferences for the paired eth wallet
        this.walletProvider.updateRemotePreferences(this.pairedWallet);
        this.navCtrl.popToRoot().then(() => {
          this.events.publish('Local/FetchWallets');
          this.onGoingProcessProvider.clear();
          const infoSheet = this.actionSheetProvider.createInfoSheet(
            'token-added',
            { name: customToken.name }
          );
          infoSheet.present();
        });
      });
  }

  public showInvoiceWarning() {
    this.invoiceWarning = this.actionSheetProvider.createInfoSheet(
      'custom-tokens-warning'
    );
    this.invoiceWarning.present();
  }

  public openConfirmModal(token?): void {
    const modal = this.modalCtrl.create(
      ConfirmAddTokenModalPage,
      { token },
      { showBackdrop: false, enableBackdropDismiss: true }
    );
    modal.present();
    modal.onWillDismiss(data => {
      if (data && data.token) {
        const { name, address, symbol, decimals, logoURI } = data.token;

        this.createAndBindTokenWallet({
          keyId: this.keyId,
          name,
          address,
          logoURI,
          symbol: symbol.toLowerCase(),
          decimals
        });
      }
    });
  }

  public addCustomTokenModal(): void {
    const modal = this.modalCtrl.create(
      AddCustomTokenModalPage,
      { pairedWallet: this.pairedWallet },
      { showBackdrop: false, enableBackdropDismiss: true }
    );
    modal.present();
    modal.onWillDismiss(data => {
      if (data && data.token) {
        const { name, address, symbol, decimals, logoURI } = data.token;

        this.createAndBindTokenWallet({
          keyId: this.keyId,
          name,
          address,
          logoURI,
          symbol: symbol.toLowerCase(),
          decimals
        });
      }
    });
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

    exactResult = this.availableCustomTokens.filter(token => {
      return (
        token.symbol.toLowerCase() == search.toLowerCase() ||
        token.name.toLowerCase() == search.toLowerCase() ||
        token.address.toLowerCase() == search.toLowerCase()
      );
    });
    filteredPopularTokens = this.availableCustomTokens.filter(token => {
      return (
        this.currencyProvider.getPopularErc20Tokens().includes(token.symbol) &&
        (token.name.toLowerCase().includes(search.toLowerCase()) ||
          token.symbol.toLowerCase().includes(search.toLowerCase()))
      );
    });
    filteredTokens = this.availableCustomTokens.filter(token => {
      return (
        token.name.toLowerCase().includes(search.toLowerCase()) ||
        token.symbol.toLowerCase().includes(search.toLowerCase())
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

  public close(): void {
    this.viewCtrl.dismiss();
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
