import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';

// pages

import { IncomingDataProvider } from '../../../providers/incoming-data/incoming-data';
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
    private navParam: NavParams,
    private incomingDataProvider: IncomingDataProvider
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
    if (this.nextPage == 'confirm') this.goToConfirm(coin);
  }

  public goToCreateWallet(coin): void {
    this.navCtrl.push(CreateWalletPage, { isShared: this.isShared, coin });
  }

  public goToImportWallet(coin): void {
    this.navCtrl.push(ImportWalletPage, { coin });
  }

  public goToConfirm(coin): void {
    const testStr: string =
      this.invoiceData.indexOf('test.bitpay.com') > -1 ? 'test.' : '';
    let invoiceId: string = this.invoiceData.replace(
      /https:\/\/(www.)?(test.)?bitpay.com\/invoice\?id=/,
      ''
    );
    invoiceId = invoiceId.split('&')[0];
    // Need to add BCH testnet bchtest: payProUrl
    const payProBitcoinUrl: string = `bitcoin:?r=https://${testStr}bitpay.com/i/${invoiceId}`;
    const payProBitcoinCashUrl: string = `bitcoincash:?r=https://${testStr}bitpay.com/i/${invoiceId}`;

    const payProUrl = coin === 'btc' ? payProBitcoinUrl : payProBitcoinCashUrl;
    this.incomingDataProvider.redir(payProUrl);
  }
}
