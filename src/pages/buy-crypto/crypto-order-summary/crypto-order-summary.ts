import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ModalController, NavParams } from 'ionic-angular';

// Providers
import { Logger } from '../../../providers/logger/logger';
import { SimplexProvider } from '../../../providers/simplex/simplex';

// Pages
import { CryptoCoinsPage } from '../../../pages/buy-crypto/crypto-coins/crypto-coins';
import { CryptoPaymentMethodPage } from '../../../pages/buy-crypto/crypto-payment-method/crypto-payment-method';
import { AmountPage } from '../../../pages/send/amount/amount';
@Component({
  selector: 'page-crypto-order-summary',
  templateUrl: 'crypto-order-summary.html'
})
export class CryptoOrderSummaryPage {
  public walletId: any;
  public coin: string;
  public paymentMethod: any;
  public country: string;
  public currency: string;
  public currencies;
  public amount: any;

  constructor(
    private logger: Logger,
    private navParams: NavParams,
    private translate: TranslateService,
    private modalCtrl: ModalController,
    private simplexProvider: SimplexProvider
  ) {
    this.currencies = this.simplexProvider.supportedCoins;
  }

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
    this.walletId = this.navParams.data.walletId;
  }

  public openAmountModal() {
    let modal = this.modalCtrl.create(
      AmountPage,
      {
        fromBuyCrypto: true,
        walletId: this.walletId,
        coin: this.coin,
        useAsModal: true,
        currency: this.currency
      },
      {
        showBackdrop: true,
        enableBackdropDismiss: true
      }
    );
    modal.present();
    modal.onDidDismiss(data => {
      if (data) {
        this.amount = data.fiatAmount;
        this.currency = data.currency;
      }
    });
  }

  public openCryptoCoinsModal() {
    let modal = this.modalCtrl.create(
      CryptoCoinsPage,
      {
        coin: this.coin
      },
      {
        showBackdrop: true,
        enableBackdropDismiss: true
      }
    );
    modal.present();
    modal.onDidDismiss(data => {
      if (data) {
        this.coin = data.coinSelected;
      }
    });
  }

  public openCryptoPaymentMethodModal() {
    let modal = this.modalCtrl.create(
      CryptoPaymentMethodPage,
      {
        paymentMethod: this.paymentMethod.method,
        useAsModal: true
      },
      {
        showBackdrop: true,
        enableBackdropDismiss: true
      }
    );
    modal.present();
    modal.onDidDismiss(data => {
      if (data) {
        this.paymentMethod = data.paymentMethod;
      }
    });
  }
}
