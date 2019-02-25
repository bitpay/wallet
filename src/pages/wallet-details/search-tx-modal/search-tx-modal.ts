import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';
import * as _ from 'lodash';

// Providers
import { GiftCardProvider } from '../../../providers/gift-card/gift-card';
import { CardConfigMap } from '../../../providers/gift-card/gift-card.types';
import { PlatformProvider } from '../../../providers/platform/platform';
import { TimeProvider } from '../../../providers/time/time';

@Component({
  selector: 'page-search-tx-modal',
  templateUrl: 'search-tx-modal.html'
})
export class SearchTxModalPage {
  private HISTORY_SHOW_LIMIT: number;
  private currentTxHistoryPage: number;

  public wallet;
  public isCordova: boolean;
  public filteredTxHistory;
  public txHistorySearchResults;
  public txHistoryShowMore: boolean;
  public completeTxHistory;
  public addressbook;
  public search: string;
  public supportedCards: Promise<CardConfigMap>;

  constructor(
    private giftCardProvider: GiftCardProvider,
    private navParams: NavParams,
    private platformProvider: PlatformProvider,
    private timeProvider: TimeProvider,
    private viewCtrl: ViewController
  ) {
    this.HISTORY_SHOW_LIMIT = 10;
    this.currentTxHistoryPage = 0;
    this.txHistorySearchResults = [];
    this.isCordova = this.platformProvider.isCordova;
    this.addressbook = this.navParams.data.addressbook;
    this.completeTxHistory = this.navParams.data.completeHistory;
    this.wallet = this.navParams.data.wallet;
    this.supportedCards = this.giftCardProvider.getSupportedCardMap();
  }

  public close(txid: string): void {
    this.viewCtrl.dismiss({ txid });
  }

  public updateSearchInput(search: string): void {
    this.currentTxHistoryPage = 0;
    this.throttleSearch(search);
  }

  private throttleSearch = _.throttle((search: string) => {
    this.txHistorySearchResults = this.filter(search).slice(
      0,
      this.HISTORY_SHOW_LIMIT
    );
  }, 1000);

  private filter(search: string) {
    this.filteredTxHistory = [];

    if (_.isEmpty(search)) {
      this.txHistoryShowMore = false;
      return [];
    }

    this.filteredTxHistory = _.filter(this.completeTxHistory, tx => {
      if (!tx.searcheableString)
        tx.searcheableString = this.computeSearchableString(tx);
      return _.includes(tx.searcheableString, search.toLowerCase());
    });

    this.txHistoryShowMore =
      this.filteredTxHistory.length > this.HISTORY_SHOW_LIMIT ? true : false;

    return this.filteredTxHistory;
  }

  private computeSearchableString(tx) {
    let addressBook = '';
    if (tx.addressTo && this.addressbook && this.addressbook[tx.addressTo])
      addressBook =
        this.addressbook[tx.addressTo].name ||
        this.addressbook[tx.addressTo] ||
        '';
    let searchableDate = this.computeSearchableDate(new Date(tx.time * 1000));
    let message = tx.message ? tx.message : '';
    let comment = tx.note ? tx.note.body : '';
    let addressTo = tx.addressTo ? tx.addressTo : '';
    let txid = tx.txid ? tx.txid : '';
    return (
      tx.amountStr +
      message +
      addressTo +
      addressBook +
      searchableDate +
      comment +
      txid
    )
      .toString()
      .toLowerCase();
  }

  private computeSearchableDate(date: Date): string {
    let day = ('0' + date.getDate()).slice(-2).toString();
    let month = ('0' + (date.getMonth() + 1)).slice(-2).toString();
    let year = date.getFullYear();
    return [month, day, year].join('/');
  }

  public moreSearchResults(loading): void {
    setTimeout(() => {
      this.currentTxHistoryPage++;
      this.showHistory();
      loading.complete();
    }, 100);
  }

  public showHistory(): void {
    this.txHistorySearchResults = this.filteredTxHistory
      ? this.filteredTxHistory.slice(
          0,
          (this.currentTxHistoryPage + 1) * this.HISTORY_SHOW_LIMIT
        )
      : [];
    this.txHistoryShowMore =
      this.filteredTxHistory.length > this.txHistorySearchResults.length;
  }

  public trackByFn(index: number): number {
    return index;
  }

  public createdWithinPastDay(time): boolean {
    return this.timeProvider.withinPastDay(time);
  }
}
