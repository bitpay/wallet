import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';
import * as papa from 'papaparse';

// Providers
import { AppProvider } from '../../../../../providers/app/app';
import { ConfigProvider } from '../../../../../providers/config/config';
import { CurrencyProvider } from '../../../../../providers/currency/currency';
import { Logger } from '../../../../../providers/logger/logger';
import { PlatformProvider } from '../../../../../providers/platform/platform';
import { ProfileProvider } from '../../../../../providers/profile/profile';
import { WalletProvider } from '../../../../../providers/wallet/wallet';

// Pages
import { WalletDetailsPage } from '../../../../wallet-details/wallet-details';

@Component({
  selector: 'page-wallet-transaction-history',
  templateUrl: 'wallet-transaction-history.html'
})
export class WalletTransactionHistoryPage {
  public wallet;
  public csvReady: boolean;
  public appName: string;
  public isCordova: boolean;
  public err;
  public config;
  public csvContent;
  public csvFilename;
  public csvHeader: string[];
  public satToUnit: number;

  private currency: string;

  constructor(
    private profileProvider: ProfileProvider,
    private navCtrl: NavController,
    private navParams: NavParams,
    private configProvider: ConfigProvider,
    private currencyProvider: CurrencyProvider,
    private logger: Logger,
    private platformProvider: PlatformProvider,
    private appProvider: AppProvider,
    private translate: TranslateService,
    private walletProvider: WalletProvider
  ) {
    this.csvReady = false;
    this.csvContent = [];
  }

  ionViewDidLoad() {
    this.logger.info('Loaded:  WalletTransactionHistoryPage');
  }

  ionViewWillEnter() {
    this.wallet = this.profileProvider.getWallet(this.navParams.data.walletId);
    this.currency = this.wallet.coin.toUpperCase();
    this.isCordova = this.platformProvider.isCordova;
    this.appName = this.appProvider.info.nameCase;
    this.config = this.configProvider.get();
    const { unitToSatoshi } = this.currencyProvider.getPrecision(
      this.wallet.coin
    );
    this.satToUnit = 1 / unitToSatoshi;
    this.csvHistory();
  }

  private formatDate(date): string {
    const dateObj = new Date(date);
    if (!dateObj) {
      this.logger.warn('Error formating a date');
      return 'DateError';
    }
    if (!dateObj.toJSON()) {
      return '';
    }
    return dateObj.toJSON();
  }

  // TODO : move this to walletService.
  public csvHistory() {
    this.logger.info('Generating CSV from History');
    this.walletProvider
      .fetchTxHistory(this.wallet, null, {})
      .then(txs => {
        if (_.isEmpty(txs)) {
          this.logger.warn('Failed to generate CSV: no transactions');
          this.err = this.translate.instant('No transactions');
          return;
        }

        this.logger.debug('Wallet Transaction History Length:', txs.length);

        const data = txs;
        this.csvFilename = this.appName + '-' + this.wallet.name + '.csv';
        this.csvHeader = [
          'Date',
          'Destination',
          'Description',
          'Amount',
          'Currency',
          'Txid',
          'Creator',
          'Copayers',
          'Comment'
        ];

        let _amount, _note, _copayers, _creator, _comment;

        data.forEach(it => {
          let amount = it.amount;

          if (it.action == 'moved') amount = 0;

          _copayers = '';
          _creator = '';

          if (it.actions && it.actions.length > 1) {
            for (let i = 0; i < it.actions.length; i++) {
              _copayers +=
                it.actions[i].copayerName + ':' + it.actions[i].type + ' - ';
            }
            _creator =
              it.creatorName && it.creatorName != 'undefined'
                ? it.creatorName
                : '';
          }
          _amount =
            (it.action == 'sent' ? '-' : '') +
            (amount * this.satToUnit).toFixed(8);
          _note = it.message || '';
          _comment = it.note ? it.note.body : '';

          if (it.action == 'moved')
            _note += ' Sent to self:' + (it.amount * this.satToUnit).toFixed(8);

          this.csvContent.push({
            Date: this.formatDate(it.time * 1000),
            Destination: it.addressTo || '',
            Description: _note,
            Amount: _amount,
            Currency: this.currency,
            Txid: it.txid,
            Creator: _creator,
            Copayers: _copayers,
            Comment: _comment
          });

          if (it.fees && (it.action == 'moved' || it.action == 'sent')) {
            const _fee = (it.fees * this.satToUnit).toFixed(8);
            this.csvContent.push({
              Date: this.formatDate(it.time * 1000),
              Destination: 'Bitcoin Network Fees',
              Description: '',
              Amount: '-' + _fee,
              Currency: this.currency,
              Txid: '',
              Creator: '',
              Copayers: ''
            });
          }
        });
        this.csvReady = true;
      })
      .catch(err => {
        if (err == 'HISTORY_IN_PROGRESS') {
          this.logger.debug('History in progress: Trying again in 5 secs...');
          setTimeout(() => {
            this.csvHistory();
          }, 5000);
          return;
        }

        this.logger.warn('Failed to generate CSV:', err);
        this.err = err;
      });
  }

  public downloadCSV() {
    if (!this.csvReady) return;
    const csv = papa.unparse({
      fields: this.csvHeader,
      data: this.csvContent
    });

    const blob = new Blob([csv]);
    const a = window.document.createElement('a');
    a.href = window.URL.createObjectURL(blob);
    a.download = this.csvFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  public clearTransactionHistory() {
    this.logger.info('Removing Transaction history ' + this.wallet.id);
    this.walletProvider.clearTxHistory(this.wallet);
    this.logger.info('Transaction history cleared for :' + this.wallet.id);
    this.navCtrl.popToRoot().then(() => {
      setTimeout(() => {
        this.navCtrl.push(WalletDetailsPage, {
          walletId: this.wallet.credentials.walletId
        });
      }, 1000);
    });
  }
}
