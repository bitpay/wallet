import { Component } from '@angular/core';
import axios from 'axios';
import { NavController, NavParams } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';
// pages

import { ContactEmailPage } from '../contact-email/contact-email';
import { CreateWalletPage } from '../create-wallet/create-wallet';
import { ImportWalletPage } from '../import-wallet/import-wallet';

@Component({
  selector: 'page-select-currency',
  templateUrl: 'select-currency.html'
})
export class SelectCurrencyPage {
  public coin: string;
  private isShared: boolean;
  private nextPage: string;
  private invoiceData: string;

  constructor(
    private navCtrl: NavController,
    private logger: Logger,
    private navParam: NavParams
  ) {
    this.isShared = this.navParam.data.isShared;
    this.nextPage = this.navParam.data.nextPage;
    this.invoiceData = this.navParam.data.invoiceData;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: SelectCurrencyPage');
  }

  public goToNextPage(coin): void {
    if (this.nextPage == 'create') this.goToCreateWallet(coin);
    if (this.nextPage == 'import') this.goToImportWallet(coin);
    if (this.nextPage == 'confirm') this.goToContactEmail(coin);
  }

  public goToCreateWallet(coin): void {
    this.navCtrl.push(CreateWalletPage, { isShared: this.isShared, coin });
  }

  public goToImportWallet(coin): void {
    this.navCtrl.push(ImportWalletPage, { coin });
  }

  private async setBuyerSelectedTransactionCurrency(
    testStr: string,
    invoiceId: string,
    coin: string
  ) {
    try {
      await axios.post(
        `https://${testStr}bitpay.com/invoiceData/setBuyerSelectedTransactionCurrency`,
        {
          buyerSelectedTransactionCurrency: coin.toUpperCase(),
          invoiceId
        }
      );
    } catch (err) {
      this.logger.error(err, 'Cannot Set Buyer Selected Transaction Currency');
      this.navCtrl.push(ContactEmailPage, { testStr, invoiceId, coin });
    }
  }

  public async goToContactEmail(coin) {
    const testStr: string =
      this.invoiceData.indexOf('test.bitpay.com') > -1 ? 'test.' : '';
    let invoiceId: string = this.invoiceData.replace(
      /https:\/\/(www.)?(test.)?bitpay.com\/invoice\//,
      ''
    );
    await this.setBuyerSelectedTransactionCurrency(testStr, invoiceId, coin);
    this.navCtrl.push(ContactEmailPage, { testStr, invoiceId, coin });
  }
}
