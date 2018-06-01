import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController, NavParams } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';

// Pages
import { AmountPage } from '../../send/amount/amount';

// providers
import { BitPayCardProvider } from '../../../providers/bitpay-card/bitpay-card';
import { BitPayProvider } from '../../../providers/bitpay/bitpay';
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';
import { PopupProvider } from '../../../providers/popup/popup';
import { TimeProvider } from '../../../providers/time/time';

import * as _ from 'lodash';
import * as moment from 'moment';

@Component({
  selector: 'page-bitpay-card',
  templateUrl: 'bitpay-card.html'
})
export class BitPayCardPage {
  public network: string;
  public dateRange: any;
  public cardId: string;
  public getStarted: boolean;
  public loadingHistory: boolean;
  public bitpayCardTransactionHistoryCompleted: any;
  public bitpayCardTransactionHistoryConfirming: any;
  public bitpayCardTransactionHistoryPreAuth: any;
  public balance: number;
  public updatedOn: number;
  public lastFourDigits: number;
  public currencySymbol: string;
  public currency: string;

  constructor(
    private translate: TranslateService,
    private bitPayProvider: BitPayProvider,
    private bitPayCardProvider: BitPayCardProvider,
    private logger: Logger,
    private popupProvider: PopupProvider,
    private timeProvider: TimeProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private navParams: NavParams,
    private navCtrl: NavController
  ) {
    this.dateRange = {
      value: 'last30Days'
    };
    this.network = this.bitPayProvider.getEnvironment().network;
    this.cardId = this.navParams.data.id;

    if (!this.cardId) this.navCtrl.pop();

    this.bitPayCardProvider.get(
      {
        cardId: this.cardId,
        noRefresh: true
      },
      (err, cards) => {
        if (cards && cards[0]) {
          this.lastFourDigits = cards[0].lastFourDigits;
          this.balance = cards[0].balance;
          this.currencySymbol = cards[0].currencySymbol;
          this.updatedOn = cards[0].updatedOn;
          this.currency = cards[0].currency;
        }
        this.update();
      }
    );
  }

  private setDateRange(preset: string): any {
    let startDate;
    let endDate;
    preset = preset || 'last30Days';
    switch (preset) {
      case 'last30Days':
        startDate = moment()
          .subtract(30, 'days')
          .toISOString();
        endDate = moment().toISOString();
        break;
      case 'lastMonth':
        startDate = moment()
          .startOf('month')
          .subtract(1, 'month')
          .toISOString();
        endDate = moment()
          .startOf('month')
          .toISOString();
        break;
      case 'all':
        startDate = null;
        endDate = null;
        break;
      default:
        return;
    }
    return {
      startDate,
      endDate
    };
  }

  private setGetStarted(history: any, cb: () => any) {
    // Is the card new?
    if (!_.isEmpty(history.transactionList)) return cb();

    let dateRange = this.setDateRange('all');
    this.bitPayCardProvider.getHistory(
      this.cardId,
      dateRange,
      (err, history) => {
        if (!err && _.isEmpty(history.transactionList)) this.getStarted = true;

        return cb();
      }
    );
  }

  public update() {
    let dateRange = this.setDateRange(this.dateRange.value);

    this.loadingHistory = true;
    this.bitPayCardProvider.getHistory(
      this.cardId,
      dateRange,
      (err, history) => {
        this.loadingHistory = false;

        if (err) {
          this.logger.error(err);
          this.bitpayCardTransactionHistoryCompleted = null;
          this.bitpayCardTransactionHistoryConfirming = null;
          this.bitpayCardTransactionHistoryPreAuth = null;
          this.balance = null;
          this.popupProvider.ionicAlert(
            'Error',
            this.translate.instant('Could not get transactions')
          );
          return;
        }

        this.setGetStarted(history, () => {
          let txs = _.clone(history.txs);

          this.setDateTime(txs);

          this.bitpayCardTransactionHistoryConfirming = this.bitPayCardProvider.filterTransactions(
            'confirming',
            txs
          );
          this.bitpayCardTransactionHistoryCompleted = this.bitPayCardProvider.filterTransactions(
            'completed',
            txs
          );
          this.bitpayCardTransactionHistoryPreAuth = this.bitPayCardProvider.filterTransactions(
            'preAuth',
            txs
          );

          this.balance = history.currentCardBalance;
          this.updatedOn = null;

          if (this.dateRange.value == 'last30Days') {
            // TODO?
            // $log.debug('BitPay Card: storing cache history');
            // let cacheHistory = {
            //   balance: history.currentCardBalance,
            //   transactions: history.txs
            // };
            // this.bitPayCardProvider.setHistory($scope.cardId, cacheHistory, {}, (err) => {
            //   if (err) $log.error(err);
            //   $scope.historyCached = true;
            // });
          }
        });
      }
    );
  }

  private setDateTime(txs) {
    let txDate, txDateUtc;
    let newDate;
    for (let i = 0; i < txs.length; i++) {
      txDate = new Date(txs[i].date);
      txDateUtc = new Date(txs[i].date.replace('Z', ''));
      let amTime = this.createdWithinPastDay(txs[i]);
      newDate = amTime
        ? moment(txDateUtc).fromNow()
        : moment(txDate)
            .utc()
            .format('MMM D, YYYY');
      txs[i].date = newDate;
    }
  }

  private createdWithinPastDay(tx: any) {
    let result = false;
    if (tx.date) {
      result = this.timeProvider.withinPastDay(tx.date);
    }
    return result;
  }

  public openExternalLink(url: string) {
    let optIn = true;
    let title = null;
    let message = this.translate.instant(
      'Help and support information is available at the website.'
    );
    let okText = this.translate.instant('Open');
    let cancelText = this.translate.instant('Go Back');
    this.externalLinkProvider.open(
      url,
      optIn,
      title,
      message,
      okText,
      cancelText
    );
  }

  public viewOnBlockchain(transactionId: string) {
    let url = 'https://insight.bitpay.com/tx/' + transactionId;
    let optIn = true;
    let title = null;
    let message = this.translate.instant('View Transaction on Insight');
    let okText = this.translate.instant('Open Insight');
    let cancelText = this.translate.instant('Go Back');
    this.externalLinkProvider.open(
      url,
      optIn,
      title,
      message,
      okText,
      cancelText
    );
  }

  public topUp(): void {
    this.navCtrl.push(AmountPage, {
      id: this.cardId,
      nextPage: 'BitPayCardTopUpPage',
      currency: this.currency
    });
  }
}
