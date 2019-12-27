import { Component } from '@angular/core';
import { ModalController, NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';

// Pages
import { SimplexBuyPage } from './simplex-buy/simplex-buy';
import { SimplexDetailsPage } from './simplex-details/simplex-details';

// Proviers
import { ExternalLinkProvider } from '../../../providers/external-link/external-link';
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
    private externalLinkProvider: ExternalLinkProvider,
    private modalCtrl: ModalController,
    private navCtrl: NavController,
    private navParams: NavParams,
    private simplexProvider: SimplexProvider
  ) {}

  ionViewDidLoad() {
    this.paymentRequests = [];
    this.logger.info('Loaded: SimplexPage');
  }

  ionViewWillEnter() {
    this.init();
  }

  private init() {
    this.loading = true;
    this.simplexProvider
      .getSimplex()
      .then(simplexData => {
        if (simplexData) {
          if (
            !_.isEmpty(this.navParams.data) &&
            this.navParams.data.paymentId &&
            simplexData[this.navParams.data.paymentId]
          ) {
            simplexData[this.navParams.data.paymentId].status =
              this.navParams.data.success === 'true' ? 'success' : 'failed';
            this.simplexProvider
              .saveSimplex(simplexData[this.navParams.data.paymentId], null)
              .catch(() => {
                this.logger.warn('Could not update payment request status');
              });
          }

          const paymentRequests: any = {};
          Object.assign(paymentRequests, simplexData);
          this.paymentRequests = Object.values(paymentRequests);
        }
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
    const modal = this.modalCtrl.create(SimplexDetailsPage, {
      paymentRequestData
    });

    modal.present();

    modal.onDidDismiss(() => {
      this.init();
    });
  }

  public openExternalLink(url: string) {
    this.externalLinkProvider.open(url);
  }
}
