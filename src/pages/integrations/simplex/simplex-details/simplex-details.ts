import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';
import { Logger } from '../../../../providers/logger/logger';

// Providers
import { SimplexProvider } from '../../../../providers/simplex/simplex';

@Component({
  selector: 'page-simplex-details',
  templateUrl: 'simplex-details.html'
})
export class SimplexDetailsPage {
  public paymentRequest;

  constructor(
    private navParams: NavParams,
    private simplexProvider: SimplexProvider,
    private viewCtrl: ViewController,
    private logger: Logger
  ) {
    this.paymentRequest = this.navParams.data.paymentRequestData;
  }

  ionViewDidLoad() {
    this.logger.info('Loaded: SimplexDetailsPage');
  }

  public remove() {
    this.simplexProvider
      .saveSimplex(this.paymentRequest, {
        remove: true
      })
      .then(() => {
        this.close();
      });
  }

  public close() {
    this.viewCtrl.dismiss();
  }
}
