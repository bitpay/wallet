import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
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
import { AddressProvider } from '../../../providers/address/address';
import { ProfileProvider } from '../../../providers/profile/profile';
import { WalletProvider } from '../../../providers/wallet/wallet';
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
    private addressProvider: AddressProvider,
    private translate: TranslateService,
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
    this.availableCustomTokens = _.orderBy(
      this.currencyProvider.getAvailableCustomTokens(),
      'name'
    ).filter(token => {
      return token.symbol.toLowerCase() != 'eth';
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

  public async setTokenInfo() {
    if (_.isEmpty(this.customTokenForm.value.tokenAddress)) return;

    const opts = {
      tokenAddress: this.customTokenForm.value.tokenAddress
    };

    this.customTokenForm.controls['tokenName'].setValue(null);
    this.customTokenForm.controls['tokenSymbol'].setValue(null);
    this.customTokenForm.controls['tokenDecimals'].setValue(null);

    const isValid = this.checkCoinAndNetwork(
      this.customTokenForm.value.tokenAddress
    );
    if (!isValid) return;

    let tokenContractInfo;
    try {
      tokenContractInfo = await this.walletProvider.getTokenContractInfo(
        this.pairedWallet,
        opts
      );
    } catch (error) {
      await this.actionSheetProvider
        .createInfoSheet('default-error', {
          msg: this.translate.instant(
            'Could not find any ERC20 contract attached to the provided address.'
          ),
          title: this.translate.instant('Error')
        })
        .present();
      this.isValid = undefined;
      return;
    }

    tokenContractInfo.address = this.customTokenForm.value.tokenAddress;

    this.setCustomToken(tokenContractInfo);
  }

  private setCustomToken(tokenContractInfo) {
    this.customTokenForm.controls['tokenAddress'].setValue(
      tokenContractInfo.address
    );
    this.customTokenForm.controls['tokenName'].setValue(tokenContractInfo.name);
    this.customTokenForm.controls['tokenSymbol'].setValue(
      tokenContractInfo.symbol
    );
    this.customTokenForm.controls['tokenDecimals'].setValue(
      tokenContractInfo.decimals
    );
  }

  private checkCoinAndNetwork(address: string): boolean {
    const addrData = this.addressProvider.getCoinAndNetwork(
      address,
      this.pairedWallet.network
    );
    this.isValid = Boolean(
      addrData &&
        this.pairedWallet.coin == addrData.coin &&
        this.pairedWallet.network == addrData.network
    );
    return this.isValid;
  }

  public showInvoiceWarning() {
    this.invoiceWarning = this.actionSheetProvider.createInfoSheet(
      'custom-tokens-warning'
    );
    this.invoiceWarning.present();
  }

  public openConfirmModal(token): void {
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
    if (!search || search == '') {
      this.filteredTokens = _.clone(this.availableCustomTokens);
    } else {
      this.filteredTokens = [];

      const exactResult: any[] = this.availableCustomTokens.filter(token => {
        return (
          token.symbol.toLowerCase() == search.toLowerCase() ||
          token.name.toLowerCase() == search.toLowerCase() ||
          token.address.toLowerCase() == search.toLowerCase()
        );
      });
      const filteredTokens = this.availableCustomTokens.filter(token => {
        return (
          token.name.toLowerCase().includes(search.toLowerCase()) ||
          token.symbol.toLowerCase().includes(search.toLowerCase())
        );
      });

      this.filteredTokens = [...new Set([...exactResult, ...filteredTokens])];
    }

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
  }
}
