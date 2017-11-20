import { Component } from '@angular/core';
import { NavController, NavParams, ModalController } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';

//providers
import { ProfileProvider } from '../../../../../providers/profile/profile';
import { ConfigProvider } from '../../../../../providers/config/config';
import { PlatformProvider } from '../../../../../providers/platform/platform';
import { AppProvider } from '../../../../../providers/app/app';
import { PersistenceProvider } from '../../../../../providers/persistence/persistence';
import { WalletProvider } from '../../../../../providers/wallet/wallet';

//pages
import { HomePage } from '../../../../../pages/home/home';
import { WalletDetailsPage } from '../../../../../pages/wallet-details/wallet-details';

import * as _ from 'lodash';

@Component({
  selector: 'page-wallet-transaction-history',
  templateUrl: 'wallet-transaction-history.html',
})
export class WalletTransactionHistoryPage {

  public wallet: any;
  public csvReady: boolean = false;
  public appName: string;
  public isCordova: boolean;
  public allTxs: any;
  public err: any;
  public config: any;
  public csvContent: Array<any> = [];
  public csvFilename: any;
  public csvHeader: Array<string>;

  public unitToSatoshi: number;
  public unitDecimals: number;
  public satToUnit: number;
  public satToBtc: number;

  constructor(
    private profileProvider: ProfileProvider,
    private navCtrl: NavController,
    private navParams: NavParams,
    private configProvider: ConfigProvider,
    private formBuilder: FormBuilder,
    private logger: Logger,
    private platformProvider: PlatformProvider,
    private appProvider: AppProvider,
    private persistenceProvider: PersistenceProvider,
    private walletProvider: WalletProvider
  ) {

  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad WalletTransactionHistoryPage');
  }

  ionViewDidEnter() {
    this.wallet = this.profileProvider.getWallet(this.navParams.data.walletId);
    this.isCordova = this.platformProvider.isCordova;
    this.appName = this.appProvider.info.nameCase;
    this.config = this.configProvider.get();
    this.unitToSatoshi = this.config.wallet.settings.unitToSatoshi;
    this.unitDecimals = this.config.wallet.settings.unitDecimals;
    this.satToUnit = 1 / this.unitToSatoshi;
    this.satToBtc = 1 / 100000000;
    this.csvHistory();
  }

  private getHistory(): Promise<any> {
    return new Promise((resolve, reject) => {
      //TODO getTxHistory not working
      this.persistenceProvider.getTxHistory(this.wallet.credentials.walletId).then((txs: any) => {
        let txsFromLocal = txs;
        this.allTxs.push(txsFromLocal);
        let compactTxs = _.compact(_.flatten(this.allTxs));
        console.log(txsFromLocal);
        console.log(compactTxs);
        console.log(_.isEmpty(compactTxs));
        if (!_.isEmpty(compactTxs)) return resolve(compactTxs);
        else return reject(null);
      }).catch((err: any) => {
        return reject(err);
      });
    });
  }

  private formatDate(date: any): string {
    var dateObj = new Date(date);
    if (!dateObj) {
      this.logger.debug('Error formating a date');
      return 'DateError'
    }
    if (!dateObj.toJSON()) {
      return '';
    }
    return dateObj.toJSON();
  };

  // TODO : move this to walletService.
  public csvHistory() {
    this.logger.debug('Generating CSV from History');
    this.getHistory().then((txs: any) => {

      this.logger.debug('Wallet Transaction History Length:', txs.length);

      var data = txs;
      this.csvFilename = this.appName + '-' + this.wallet.name + '.csv';
      this.csvHeader = ['Date', 'Destination', 'Description', 'Amount', 'Currency', 'Txid', 'Creator', 'Copayers', 'Comment'];

      var _amount, _note, _copayers, _creator, _comment;
      data.forEach((it, index) => {
        var amount = it.amount;

        if (it.action == 'moved')
          amount = 0;

        _copayers = '';
        _creator = '';

        if (it.actions && it.actions.length > 1) {
          for (var i = 0; i < it.actions.length; i++) {
            _copayers += it.actions[i].copayerName + ':' + it.actions[i].type + ' - ';
          }
          _creator = (it.creatorName && it.creatorName != 'undefined') ? it.creatorName : '';
        }
        _amount = (it.action == 'sent' ? '-' : '') + (amount * this.satToBtc).toFixed(8);
        _note = it.message || '';
        _comment = it.note ? it.note.body : '';

        if (it.action == 'moved')
          _note += ' Moved:' + (it.amount * this.satToBtc).toFixed(8)

        this.csvContent.push({
          'Date': this.formatDate(it.time * 1000),
          'Destination': it.addressTo || '',
          'Description': _note,
          'Amount': _amount,
          'Currency': 'BTC',
          'Txid': it.txid,
          'Creator': _creator,
          'Copayers': _copayers,
          'Comment': _comment
        });

        if (it.fees && (it.action == 'moved' || it.action == 'sent')) {
          var _fee = (it.fees * this.satToBtc).toFixed(8)
          this.csvContent.push({
            'Date': this.formatDate(it.time * 1000),
            'Destination': 'Bitcoin Network Fees',
            'Description': '',
            'Amount': '-' + _fee,
            'Currency': 'BTC',
            'Txid': '',
            'Creator': '',
            'Copayers': ''
          });
        }
      });
      this.csvReady = true;
    }).catch((err) => {
      if (err) {
        this.logger.warn('Failed to generate CSV:', err);
        this.err = err;
      } else {
        this.logger.warn('Failed to generate CSV: no transactions');
        this.err = 'no transactions';
      }
    });
  }

  public clearTransactionHistory(): void {
    this.logger.info('Removing Transaction history ' + this.wallet.id);

    this.walletProvider.clearTxHistory(this.wallet);

    this.logger.info('Transaction history cleared for :' + this.wallet.id);

    this.navCtrl.setRoot(HomePage);
    this.navCtrl.popToRoot();
    this.navCtrl.push(WalletDetailsPage, { walletId: this.wallet.credentials.walletId });
  }

}