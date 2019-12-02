import { Component } from '@angular/core';
import { ModalController, NavController, NavParams } from 'ionic-angular';

// Pages
import { SimplexBuyPage } from './simplex-buy/simplex-buy';
import { SimplexDetailsPage } from './simplex-details/simplex-details';

// Proviers
import { Logger } from '../../../providers/logger/logger';
import { SimplexProvider } from '../../../providers/simplex/simplex';

@Component({
  selector: 'page-simplex',
  templateUrl: 'simplex.html'
})
export class SimplexPage {
  public loading: boolean;
  public paymentRequests: any[];

  constructor(
    private logger: Logger,
    private modalCtrl: ModalController,
    private navCtrl: NavController,
    private navParams: NavParams,
    private simplexProvider: SimplexProvider
  ) {}

  ionViewDidLoad() {
    this.logger.info('Loaded: SimplexPage');
  }

  ionViewWillEnter() {
    this.init();
  }

  private init() {
    this.loading = true;
    if (this.navParams.data) {
      console.log('navParams data: ', this.navParams.data);
    }
    this.simplexProvider
      .getSimplex()
      .then(simplexData => {
        if (simplexData) {
          this.paymentRequests = Object.values(simplexData);
        }
        this.paymentRequests.forEach(paymentRequest => {
          paymentRequest.crypto_amount = paymentRequest.crypto_amount.toFixed(
            6
          );
        });
        console.log('this.paymentRequests: ', this.paymentRequests);
        this.loading = false;
      })
      .catch(err => {
        this.loading = false;
        if (err) this.logger.error(err);
      });
  }

  public continueToSimplexBuyPage(): void {
    this.navCtrl.push(SimplexBuyPage);
  }

  public openSimplexModal(paymentRequestData) {
    console.log('Opening modal...', paymentRequestData);
    const modal = this.modalCtrl.create(SimplexDetailsPage, {
      paymentRequestData
    });

    modal.present();

    modal.onDidDismiss(() => {
      this.init();
    });
  }

  // public getEvents(): void {
  //   this.simplexProvider
  //     .getEvents(this.wallet)
  //     .then(data => {
  //       console.log(data);
  //     })
  //     .catch(err => {
  //       console.log(err);
  //     });
  // }
}
