import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';
import { Logger } from '../../../../providers/logger/logger';

// Providers
import { ConfigProvider } from '../../../../providers/config/config';
import { CurrencyProvider } from '../../../../providers/currency/currency';
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { ShapeshiftProvider } from '../../../../providers/shapeshift/shapeshift';

@Component({
  selector: 'page-shapeshift-details',
  templateUrl: 'shapeshift-details.html'
})
export class ShapeshiftDetailsPage {
  public ssData;
  public amount;
  public amountUnit;

  private defaults;

  constructor(
    private configProvider: ConfigProvider,
    private currencyProvider: CurrencyProvider,
    private externalLinkProvider: ExternalLinkProvider,
    private navParams: NavParams,
    private shapeshiftProvider: ShapeshiftProvider,
    private viewCtrl: ViewController,
    private logger: Logger
  ) {
    this.defaults = this.configProvider.getDefaults();
    this.ssData = this.navParams.data.ssData;
    const amountData = this.ssData.amount.split(' ');
    this.amount = amountData[0];
    this.amountUnit = amountData[1];
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: ShapeshiftDetailsPage');
  }

  public remove() {
    this.shapeshiftProvider.saveShapeshift(
      this.ssData,
      {
        remove: true
      },
      () => {
        this.close();
      }
    );
  }

  public close() {
    this.viewCtrl.dismiss();
  }

  public openTransaction(id: string) {
    var url;
    const coins = this.currencyProvider.getAvailableCoins();
    for (const coin of coins) {
      if (this.ssData.outgoingType.toLowerCase() == coin) {
        const isBitPay =
          this.defaults.blockExplorerUrl[coin].search('bitpay') == -1
            ? false
            : true;
        url =
          'https://' +
          this.defaults.blockExplorerUrl[coin] +
          (isBitPay ? 'mainnet/' : '') +
          'tx/' +
          id;
      }
    }

    if (url) {
      this.externalLinkProvider.open(url);
    } else {
      return;
    }
  }
}
