import { Component } from '@angular/core';
import { ViewController } from 'ionic-angular';
import * as _ from 'lodash';

// Providers
import { CurrencyProvider } from '../../../../providers/currency/currency';

@Component({
  selector: 'page-search-token-modal',
  templateUrl: 'search-token-modal.html'
})
export class SearchTokenModalPage {
  private currentTokenListPage: number;
  private TOKEN_SHOW_LIMIT: number;
  public tokenListShowMore: boolean;

  public tokenSearchResults;
  public filteredTokens;
  public searchQuery;
  public availableCustomTokens;

  constructor(
    private viewCtrl: ViewController,
    private currencyProvider: CurrencyProvider
  ) {
    this.tokenSearchResults = [];
    this.TOKEN_SHOW_LIMIT = 10;
    this.currentTokenListPage = 0;
    this.availableCustomTokens = this.currencyProvider.getAvailableCustomTokens();
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

    if (_.isEmpty(search)) {
      this.tokenListShowMore = false;
      return [];
    }

    this.filteredTokens = this.availableCustomTokens.filter(token => {
      return (
        token.name.toLowerCase().includes(search.toLowerCase()) ||
        token.symbol.toLowerCase().includes(search.toLowerCase()) ||
        token.address.toLowerCase().includes(search.toLowerCase())
      );
    });

    this.tokenListShowMore =
      this.filteredTokens.length > this.TOKEN_SHOW_LIMIT ? true : false;

    console.log(this.filteredTokens);
    return this.filteredTokens;
  }

  public close(tokenInfo: string): void {
    this.viewCtrl.dismiss({ tokenInfo });
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
