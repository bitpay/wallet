import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavParams } from 'ionic-angular';

// Providers
import { Logger } from '../../../providers/logger/logger';

@Component({
  selector: 'page-crypto-order-summary',
  templateUrl: 'crypto-order-summary.html'
})
export class CryptoOrderSummaryPage {
  public coin: string;
  public paymentMethod: any;
  public country: string;
  public currency: string;
  public amount: any;

  constructor(
    private logger: Logger,
    private navParams: NavParams,
    private translate: TranslateService
  ) {}

  ionViewDidLoad() {
    this.logger.info('Loaded: CryptoOrderSummaryPage');
  }

  ionViewWillEnter() {
    this.amount = this.navParams.data.amount;
    this.currency = this.navParams.data.currency;
    this.country =
      this.navParams.data.country || this.translate.instant('United States');
    this.paymentMethod = this.navParams.data.paymentMethod;
    this.coin = this.navParams.data.coin;
  }
}
