import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';

// Providers
import { Logger } from '../../../providers/logger/logger';

// Pages
import { CryptoOrderSummaryPage } from '../../../pages/buy-crypto/crypto-order-summary/crypto-order-summary';

@Component({
  selector: 'page-crypto-payment-method',
  templateUrl: 'crypto-payment-method.html'
})
export class CryptoPaymentMethodPage {
  methods: {
    applePay: {
      label: any;
      method: string;
      imgSrc: string;
      disabled: boolean;
      selected: boolean;
    };
    debitCard: {
      label: any;
      method: string;
      imgSrc: string;
      disabled: boolean;
      selected: boolean;
    };
    bankTransfer: {
      label: any;
      method: string;
      imgSrc: string;
      disabled: boolean;
      selected: boolean;
    };
  };
  public methodSelected: string;
  public paymentRequest;
  public useAsModal: boolean;

  constructor(
    private logger: Logger,
    private navParams: NavParams,
    private translate: TranslateService,
    private navCtrl: NavController,
    private viewCtrl: ViewController
  ) {
    this.methods = {
      applePay: {
        label: this.translate.instant('Apple Pay'),
        method: 'applePay',
        imgSrc: 'assets/img/buy-crypto/apple-pay.svg',
        disabled: false,
        selected: true
      },
      debitCard: {
        label: this.translate.instant('Debit Card'),
        method: 'debitCard',
        imgSrc: 'assets/img/buy-crypto/debit-card.svg',
        disabled: false,
        selected: false
      },
      bankTransfer: {
        label: this.translate.instant('Bank Transfer'),
        method: 'bankTransfer',
        imgSrc: 'assets/img/buy-crypto/apple-pay.svg',
        disabled: false,
        selected: false
      }
    };
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: CryptoPaymentMethodPage');
  }

  ionViewWillEnter() {
    this.methodSelected = this.navParams.data.paymentMethod || 'applePay';
    this.useAsModal = this.navParams.data.useAsModal;
  }

  public goToOrderSummary(): void {
    const params = {
      coin: this.navParams.data.coin,
      currency: this.navParams.data.currency,
      network: this.navParams.data.network,
      walletId: this.navParams.data.walletId,
      paymentMethod: this.methods[this.methodSelected],
      amount: this.navParams.data.amount
    };
    this.navCtrl.push(CryptoOrderSummaryPage, params);
  }

  public close() {
    this.viewCtrl.dismiss();
  }

  public save() {
    if (
      !this.useAsModal ||
      !this.methodSelected ||
      this.navParams.data.paymentMethod == this.methodSelected
    )
      return;
    this.viewCtrl.dismiss({ paymentMethod: this.methods[this.methodSelected] });
  }
}
