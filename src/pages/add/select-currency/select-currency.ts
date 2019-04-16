import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';
import { Logger } from '../../../providers/logger/logger';
// pages
import { ContactEmailPage } from '../contact-email/contact-email';
import { CreateWalletPage } from '../create-wallet/create-wallet';
import { ImportWalletPage } from '../import-wallet/import-wallet';

// providers
import { HttpRequestsProvider } from '../../../providers/http-requests/http-requests';
import {
  IncomingDataProvider,
  InvoiceData
} from '../../../providers/incoming-data/incoming-data';
import { ProfileProvider } from '../../../providers/profile/profile';

@Component({
  selector: 'page-select-currency',
  templateUrl: 'select-currency.html'
})
export class SelectCurrencyPage {
  public coin: string;
  private isShared: boolean;
  private nextPage: string;
  private invoiceData: string;
  public isInvoice: boolean;
  private testStr: string;
  private invoiceId: string;
  private paymentTotals: InvoiceData['invoice']['paymentTotals'];
  private hasEmail?: boolean;
  public wallets;
  public walletsBTC;
  public walletsBCH;
  public vaultWallets;

  constructor(
    private navCtrl: NavController,
    private incomingDataProvider: IncomingDataProvider,
    private httpNative: HttpRequestsProvider,
    private logger: Logger,
    private profileProvider: ProfileProvider,
    private navParam: NavParams
  ) {
    this.paymentTotals = this.navParam.data.paymentTotals;
    this.isShared = this.navParam.data.isShared;
    this.nextPage = this.navParam.data.nextPage;
    this.invoiceData = this.navParam.data.invoiceData;
    this.testStr = this.navParam.data.testStr;
    this.invoiceId = this.navParam.data.invoiceId;
    this.hasEmail = this.navParam.data.hasEmail;
    this.isInvoice =
      this.navParam.data.invoiceData && this.nextPage == 'confirm'
        ? true
        : false;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: SelectCurrencyPage');
    this.setWallets();
  }

  public goToNextPage(coin): void {
    if (this.nextPage == 'create') this.goToCreateWallet(coin);
    if (this.nextPage == 'import') this.goToImportWallet(coin);
    if (this.nextPage == 'confirm')
      this.setBuyerSelectedTransactionCurrency(coin);
  }

  public goToCreateWallet(coin): void {
    this.navCtrl.push(CreateWalletPage, { isShared: this.isShared, coin });
  }

  public goToImportWallet(coin): void {
    this.navCtrl.push(ImportWalletPage, { coin });
  }

  private parseError(err: any): string {
    if (!err) return 'Unknown Error';
    if (!err.error) return err.message ? err.message : 'Unknown Error';

    const parsedError = err.error.error_description
      ? err.error.error_description
      : err.error.error && err.error.error.message
      ? err.error.error.message
      : err.error;
    return parsedError;
  }

  private setWallets = () => {
    this.wallets = this.profileProvider.getWallets();
    this.vaultWallets = this.profileProvider.getVaultWallets();
    this.walletsBTC = _.filter(this.wallets, (x: any) => {
      return (
        x.credentials.coin == 'btc' &&
        !this.profileProvider.vaultHasWallet(x.credentials.walletId)
      );
    });
    this.walletsBCH = _.filter(this.wallets, (x: any) => {
      return (
        x.credentials.coin == 'bch' &&
        !this.profileProvider.vaultHasWallet(x.credentials.walletId)
      );
    });
  };

  public openInBrowser() {
    this.incomingDataProvider.showMenu({
      data: this.invoiceData,
      type: 'url'
    });
  }

  public checkLowBalance(coin: string) {
    const normalizedCoin = coin.toUpperCase();
    if (!this.isInvoice) {
      return false;
    }
    if (!this.wallets) {
      return true;
    }
    const walletObj = {
      BTC: this.walletsBTC,
      BCH: this.walletsBCH
    };

    const lastKnownBalance = walletObj[normalizedCoin].map(
      e => e.lastKnownBalance
    );

    // TODO: Need currency scale stuff 1e-8 -> ETH 1e-18
    const coinRegex = new RegExp(` ${normalizedCoin}`, 'g');
    const filteredBalance = lastKnownBalance.filter(
      balance =>
        Number(balance.replace(coinRegex, '')) >
        this.paymentTotals[normalizedCoin] * 1e-8
    );

    if (filteredBalance.length > 0) {
      return false;
    }
    return true;
  }

  private async setBuyerSelectedTransactionCurrency(coin: string) {
    const url = `https://${
      this.testStr
    }bitpay.com/invoiceData/setBuyerSelectedTransactionCurrency`;
    const dataSrc = {
      buyerSelectedTransactionCurrency: coin.toUpperCase(),
      invoiceId: this.invoiceId
    };
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    };

    const payProBitcoinUrl: string = `bitcoin:?r=https://${
      this.testStr
    }bitpay.com/i/${this.invoiceId}`;
    const payProBitcoinCashUrl: string = `bitcoincash:?r=https://${
      this.testStr
    }bitpay.com/i/${this.invoiceId}`;

    const payProUrl = coin === 'btc' ? payProBitcoinUrl : payProBitcoinCashUrl;

    this.httpNative.post(url, dataSrc, headers).subscribe(
      () => {
        this.logger.info(`Set Buyer Provided Currency to ${coin} SUCCESS`);
        this.hasEmail
          ? this.incomingDataProvider.redir(payProUrl)
          : this.navCtrl.push(ContactEmailPage, {
              testStr: this.testStr,
              invoiceId: this.invoiceId,
              coin
            });
      },
      data => {
        const error = this.parseError(data);
        this.logger.warn(
          'Cannot Set Buyer Selected Transaction Currency ERROR ' +
            data.status +
            '. ' +
            error
        );
      }
    );
  }
}
