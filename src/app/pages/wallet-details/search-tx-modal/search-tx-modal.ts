import { Component, ViewEncapsulation } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';
import * as _ from 'lodash';

// Providers
import { PlatformProvider } from '../../../providers/platform/platform';
import { TimeProvider } from '../../../providers/time/time';

@Component({
  selector: 'page-search-tx-modal',
  templateUrl: 'search-tx-modal.html',
  styleUrls: ['search-tx-modal.scss'],
  encapsulation: ViewEncapsulation.None
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
  supportedCards;
  constructor(
    private navParams: NavParams,
    private platformProvider: PlatformProvider,
    private timeProvider: TimeProvider,
    private viewCtrl: ModalController
  ) {
    this.HISTORY_SHOW_LIMIT = 10;
    this.currentTxHistoryPage = 0;
    this.txHistorySearchResults = [];
    this.isCordova = this.platformProvider.isCordova;
    this.addressbook = this.navParams.data.addressbook;
    this.completeTxHistory = this.navParams.data.completeHistory;
    this.wallet = this.navParams.data.wallet;
  }

  public close(txid?: string): void {
    this.viewCtrl.dismiss({ txid });
  }

  public updateSearchInput(search: string): void {
    this.currentTxHistoryPage = 0;
    this.throttleSearch(search);
  }

  converDate(number) {
    return new Date(number);
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
    if (tx.addressTo && this.addressbook) {
      const contact = _.find(this.addressbook, c => c.address === tx.addressTo);
      addressBook = contact ? contact.name : '';
    }

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
      loading.target.complete();
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

  public getContactName(address: string) {
    const existsContact = _.find(this.addressbook, c => c.address === address);
    if (existsContact) return existsContact.name;
    return null;
  }
}
