import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';

// pages
import { ContactEmailPage } from '../contact-email/contact-email';
import { CreateWalletPage } from '../create-wallet/create-wallet';
import { ImportWalletPage } from '../import-wallet/import-wallet';

// providers
import { HttpRequestsProvider } from '../../../providers/http-requests/http-requests';

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
    private httpNative: HttpRequestsProvider,
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

  private parseError(err: any): string {
    if (!err) return 'Unknow Error';
    if (!err.error) return err.message ? err.message : 'Unknow Error';

    const parsedError = err.error.error_description
      ? err.error.error_description
      : err.error.error && err.error.error.message
      ? err.error.error.message
      : err.error;
    return parsedError;
  }

  private async setBuyerSelectedTransactionCurrency(
    testStr: string,
    invoiceId: string,
    coin: string
  ) {
    const url = `https://${testStr}bitpay.com/invoiceData/setBuyerSelectedTransactionCurrency`;
    const dataSrc = {
      buyerSelectedTransactionCurrency: coin.toUpperCase(),
      invoiceId
    };
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    };

    this.httpNative.post(url, dataSrc, headers).subscribe(
      () => {
        this.logger.info(`Set Buyer Provided Currency to ${coin} SUCCESS`);
        this.navCtrl.push(ContactEmailPage, { testStr, invoiceId, coin });
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

  public async goToContactEmail(coin) {
    const testStr: string =
      this.invoiceData.indexOf('test.bitpay.com') > -1 ? 'test.' : '';
    let invoiceId: string = this.invoiceData.replace(
      /https:\/\/(www.)?(test.)?bitpay.com\/invoice\//,
      ''
    );
    await this.setBuyerSelectedTransactionCurrency(testStr, invoiceId, coin);
  }
}
